import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Plus, Send, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface PaymentSchedulePanelProps {
  contractId: string;
  contractValue: number;
}

interface PaymentSchedule {
  id: string;
  milestone_name: string;
  milestone_order: number;
  percentage: number;
  amount: number;
  trigger_type: string;
  trigger_milestone: string | null;
  status: string;
  invoice_id: string | null;
  due_date: string | null;
  paid_at: string | null;
}

const SCHEDULE_TEMPLATES = {
  standard: [
    { name: 'Deposit', percentage: 10, trigger: 'contract_signed' },
    { name: 'Framing Complete', percentage: 25, trigger: 'pm_milestone' },
    { name: 'Drywall Complete', percentage: 25, trigger: 'pm_milestone' },
    { name: 'Substantial Completion', percentage: 30, trigger: 'pm_milestone' },
    { name: 'Final', percentage: 10, trigger: 'closeout' }
  ],
  addition: [
    { name: 'Deposit', percentage: 15, trigger: 'contract_signed' },
    { name: 'Foundation Complete', percentage: 20, trigger: 'pm_milestone' },
    { name: 'Framing Complete', percentage: 20, trigger: 'pm_milestone' },
    { name: 'Rough-Ins Complete', percentage: 20, trigger: 'pm_milestone' },
    { name: 'Substantial Completion', percentage: 15, trigger: 'pm_milestone' },
    { name: 'Final', percentage: 10, trigger: 'closeout' }
  ],
  remodel: [
    { name: 'Deposit', percentage: 20, trigger: 'contract_signed' },
    { name: 'Demo Complete', percentage: 20, trigger: 'pm_milestone' },
    { name: 'Rough-Ins Complete', percentage: 25, trigger: 'pm_milestone' },
    { name: 'Substantial Completion', percentage: 25, trigger: 'pm_milestone' },
    { name: 'Final', percentage: 10, trigger: 'closeout' }
  ]
};

export function PaymentSchedulePanel({ contractId, contractValue }: PaymentSchedulePanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    percentage: '',
    trigger_type: 'manual',
    due_date: ''
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['payment-schedules', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('contract_id', contractId)
        .order('milestone_order', { ascending: true });

      if (error) throw error;
      return data as PaymentSchedule[];
    }
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async (templateKey: keyof typeof SCHEDULE_TEMPLATES) => {
      const template = SCHEDULE_TEMPLATES[templateKey];
      const schedules = template.map((item, index) => ({
        contract_id: contractId,
        milestone_name: item.name,
        milestone_order: index + 1,
        percentage: item.percentage,
        amount: (contractValue * item.percentage) / 100,
        trigger_type: item.trigger,
        status: 'pending'
      }));

      // Delete existing schedules
      await supabase
        .from('payment_schedules')
        .delete()
        .eq('contract_id', contractId);

      // Insert new schedules
      const { error } = await supabase
        .from('payment_schedules')
        .insert(schedules);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', contractId] });
      toast({ title: 'Template applied successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to apply template', variant: 'destructive' });
    }
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = schedules?.reduce((max, s) => Math.max(max, s.milestone_order), 0) || 0;
      const amount = (contractValue * Number(newMilestone.percentage)) / 100;

      const { error } = await supabase
        .from('payment_schedules')
        .insert({
          contract_id: contractId,
          milestone_name: newMilestone.name,
          milestone_order: maxOrder + 1,
          percentage: Number(newMilestone.percentage),
          amount,
          trigger_type: newMilestone.trigger_type,
          due_date: newMilestone.due_date || null,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', contractId] });
      setShowAddDialog(false);
      setNewMilestone({ name: '', percentage: '', trigger_type: 'manual', due_date: '' });
      toast({ title: 'Milestone added' });
    },
    onError: () => {
      toast({ title: 'Failed to add milestone', variant: 'destructive' });
    }
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const schedule = schedules?.find(s => s.id === scheduleId);
      if (!schedule) throw new Error('Schedule not found');

      // Get contract project info
      const { data: contract } = await supabase
        .from('contracts')
        .select('project_id, projects(homeowner_name)')
        .eq('id', contractId)
        .single();

      if (!contract) throw new Error('Contract not found');

      // Generate invoice number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .ilike('invoice_number', `INV-${year}-%`);

      const invoiceNumber = `INV-${year}-${String((count || 0) + 1).padStart(6, '0')}`;

      // Create invoice - get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          project_id: contract.project_id,
          invoice_number: invoiceNumber,
          homeowner_name: (contract.projects as any)?.client_name || 'Unknown',
          homeowner_email: 'pending@example.com',
          total_amount: schedule.amount,
          subtotal: schedule.amount,
          tax_amount: 0,
          tax_rate: 0,
          status: 'draft',
          invoice_date: new Date().toISOString(),
          due_date: schedule.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          line_items: [{ description: schedule.milestone_name, amount: schedule.amount }]
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Update schedule with invoice reference
      const { error: updateError } = await supabase
        .from('payment_schedules')
        .update({ 
          invoice_id: invoice.id, 
          status: 'invoiced' 
        })
        .eq('id', scheduleId);

      if (updateError) throw updateError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedules', contractId] });
      toast({ title: 'Invoice generated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to generate invoice', variant: 'destructive' });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'invoiced':
        return <Badge className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" /> Invoiced</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const totalPercentage = schedules?.reduce((sum, s) => sum + Number(s.percentage), 0) || 0;
  const totalScheduled = schedules?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Payment Schedule</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Contract Value: ${contractValue.toLocaleString()} | 
              Scheduled: ${totalScheduled.toLocaleString()} ({totalPercentage}%)
            </p>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(value) => applyTemplateMutation.mutate(value as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Apply Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="addition">Addition</SelectItem>
                <SelectItem value="remodel">Remodel</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Milestone</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Milestone Name</Label>
                    <Input
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                      placeholder="e.g., Framing Complete"
                    />
                  </div>
                  <div>
                    <Label>Percentage (%)</Label>
                    <Input
                      type="number"
                      value={newMilestone.percentage}
                      onChange={(e) => setNewMilestone({ ...newMilestone, percentage: e.target.value })}
                      placeholder="e.g., 25"
                    />
                  </div>
                  <div>
                    <Label>Trigger Type</Label>
                    <Select
                      value={newMilestone.trigger_type}
                      onValueChange={(value) => setNewMilestone({ ...newMilestone, trigger_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="contract_signed">Contract Signed</SelectItem>
                        <SelectItem value="pm_milestone">PM Milestone</SelectItem>
                        <SelectItem value="closeout">Closeout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date (Optional)</Label>
                    <Input
                      type="date"
                      value={newMilestone.due_date}
                      onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={() => addMilestoneMutation.mutate()} className="w-full">
                    Add Milestone
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        ) : schedules?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No payment schedule defined</p>
            <p className="text-sm">Apply a template or add milestones manually</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>%</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules?.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.milestone_order}</TableCell>
                  <TableCell className="font-medium">{schedule.milestone_name}</TableCell>
                  <TableCell>{schedule.percentage}%</TableCell>
                  <TableCell className="text-right">${Number(schedule.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {schedule.trigger_type.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {schedule.due_date ? format(new Date(schedule.due_date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                  <TableCell>
                    {schedule.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateInvoiceMutation.mutate(schedule.id)}
                        disabled={generateInvoiceMutation.isPending}
                      >
                        <Send className="h-3 w-3 mr-1" /> Invoice
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertTriangle, Search, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/context/DemoModeContext";
import { useToast } from "@/hooks/use-toast";
import { getDemoBillingPipeline } from "@/utils/demoContractorData";

interface ContractPipelineItem {
  id: string;
  project_id: string;
  project_name: string;
  homeowner_name: string;
  stage: string;
  contract_status: 'draft' | 'sent' | 'signed' | 'amended';
  deposit_status: 'pending' | 'invoiced' | 'paid';
  next_installment_date: string | null;
  balance: number;
  billing_status: 'blocked' | 'due_soon' | 'paid' | 'current';
}

export function ContractBillingPipeline() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();

  const { data: pipelineItems, isLoading } = useQuery({
    queryKey: ['contract-billing-pipeline', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoBillingPipeline();
      }

      // Get contracts with related project info
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          id,
          project_id,
          contract_value,
          signature_status,
          projects!inner (
            id,
            project_name,
            homeowner_name,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get payment schedules for each contract
      const { data: schedules } = await supabase
        .from('payment_schedules')
        .select('*')
        .order('milestone_order', { ascending: true });

      // Get invoices for balance calculation
      const { data: invoices } = await supabase
        .from('invoices')
        .select('project_id, total_amount, amount_paid, status, due_date');

      const items: ContractPipelineItem[] = (contracts || []).map((contract: any) => {
        const project = contract.projects;
        const contractSchedules = schedules?.filter(s => s.contract_id === contract.id) || [];
        const projectInvoices = invoices?.filter(i => i.project_id === contract.project_id) || [];

        // Calculate deposit status
        const depositSchedule = contractSchedules.find(s => s.milestone_order === 1);
        const depositStatus = depositSchedule?.status || 'pending';

        // Find next due installment
        const pendingSchedules = contractSchedules.filter(s => s.status !== 'paid' && s.due_date);
        const nextInstallment = pendingSchedules.sort((a, b) => 
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
        )[0];

        // Calculate balance
        const totalPaid = projectInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
        const balance = Number(contract.contract_value) - totalPaid;

        // Determine billing status
        let billingStatus: 'blocked' | 'due_soon' | 'paid' | 'current' = 'current';
        if (contract.signature_status !== 'signed') {
          billingStatus = 'blocked';
        } else if (depositStatus === 'pending') {
          billingStatus = 'blocked';
        } else if (balance <= 0) {
          billingStatus = 'paid';
        } else if (nextInstallment?.due_date) {
          const dueDate = new Date(nextInstallment.due_date);
          const now = new Date();
          const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff < 0) {
            billingStatus = 'blocked'; // overdue
          } else if (daysDiff <= 14) {
            billingStatus = 'due_soon';
          }
        }

        return {
          id: contract.id,
          project_id: contract.project_id,
          project_name: project.project_name || 'Untitled Project',
          homeowner_name: project.homeowner_name || 'Unknown',
          stage: project.status || 'unknown',
          contract_status: contract.signature_status,
          deposit_status: depositStatus as 'pending' | 'invoiced' | 'paid',
          next_installment_date: nextInstallment?.due_date || null,
          balance,
          billing_status: billingStatus
        };
      });

      // Sort: Due Date → Overdue → Project Start
      return items.sort((a, b) => {
        // Overdue/blocked first
        if (a.billing_status === 'blocked' && b.billing_status !== 'blocked') return -1;
        if (b.billing_status === 'blocked' && a.billing_status !== 'blocked') return 1;
        // Then due soon
        if (a.billing_status === 'due_soon' && b.billing_status !== 'due_soon') return -1;
        if (b.billing_status === 'due_soon' && a.billing_status !== 'due_soon') return 1;
        // Then by next installment date
        if (a.next_installment_date && b.next_installment_date) {
          return new Date(a.next_installment_date).getTime() - new Date(b.next_installment_date).getTime();
        }
        return 0;
      });
    }
  });

  const filteredItems = pipelineItems?.filter(item => {
    const matchesSearch = 
      item.project_name.toLowerCase().includes(search.toLowerCase()) ||
      item.homeowner_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.billing_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'blocked':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Blocked</Badge>;
      case 'due_soon':
        return <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><Clock className="h-3 w-3" /> Due Soon</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3" /> Paid</Badge>;
      default:
        return <Badge variant="outline">Current</Badge>;
    }
  };

  const getContractBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Signed</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" /> Sent</Badge>;
      case 'amended':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Amended</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getDepositBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'invoiced':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" /> Invoiced</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const handleRowClick = (item: ContractPipelineItem) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: `View contract details for ${item.project_name} - This action is simulated in demo mode.`,
      });
    } else {
      navigate(`/finance/contract/${item.id}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract & Billing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <CardTitle>Contract & Billing Pipeline</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="due_soon">Due Soon</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Next Installment</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems?.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(item)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.project_name}</p>
                        <p className="text-sm text-muted-foreground">{item.homeowner_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.stage.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{getContractBadge(item.contract_status)}</TableCell>
                    <TableCell>{getDepositBadge(item.deposit_status)}</TableCell>
                    <TableCell>
                      {item.next_installment_date 
                        ? format(new Date(item.next_installment_date), 'MMM d, yyyy')
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.billing_status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorSidebar } from "@/components/contractor/ContractorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentSchedulePanel } from "@/components/finance/PaymentSchedulePanel";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock,
  DollarSign,
  Building2,
  User,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

export default function ContractDetail() {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = contractId === 'new';
  const preselectedProjectId = searchParams.get('projectId');

  const [formData, setFormData] = useState({
    project_id: preselectedProjectId || '',
    contract_value: '',
    financing_type: 'cash',
    lender_name: '',
    notes: ''
  });

  // Update form when preselectedProjectId changes
  useEffect(() => {
    if (preselectedProjectId && isNew) {
      setFormData(prev => ({ ...prev, project_id: preselectedProjectId }));
    }
  }, [preselectedProjectId, isNew]);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          projects(id, project_name, homeowner_name, address, status)
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !isNew
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-for-contract'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractor_projects')
        .select('id, project_name, client_name, estimated_value')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isNew
  });

  // Pre-fill contract value when a project is selected
  useEffect(() => {
    if (formData.project_id && projects) {
      const selectedProject = projects.find(p => p.id === formData.project_id);
      if (selectedProject?.estimated_value && !formData.contract_value) {
        setFormData(prev => ({ 
          ...prev, 
          contract_value: String(selectedProject.estimated_value) 
        }));
      }
    }
  }, [formData.project_id, projects]);

  const createContractMutation = useMutation({
    mutationFn: async () => {
      // Generate contract number
      const contractNumber = await supabase.rpc('generate_contract_number');
      
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          contract_number: contractNumber.data || `C-${Date.now()}`,
          project_id: formData.project_id,
          contract_value: Number(formData.contract_value),
          financing_type: formData.financing_type,
          lender_name: formData.lender_name || null,
          notes: formData.notes || null,
          signature_status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: 'Contract created successfully' });
      navigate(`/finance/contract/${data.id}`);
    },
    onError: () => {
      toast({ title: 'Failed to create contract', variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const updates: any = { signature_status: newStatus };
      if (newStatus === 'signed') {
        updates.signed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      toast({ title: 'Contract status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Signed</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" /> Sent</Badge>;
      case 'amended':
        return <Badge className="bg-purple-100 text-purple-800">Amended</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <ContractorSidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-muted rounded w-1/3" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ContractorSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/finance/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {isNew ? 'New Contract' : contract?.contract_number}
                </h1>
                {contract && (
                  <p className="text-muted-foreground">
                    {(contract.projects as any)?.project_name} • {(contract.projects as any)?.homeowner_name}
                  </p>
                )}
              </div>
              {contract && getStatusBadge(contract.signature_status)}
            </div>

            {isNew ? (
              /* New Contract Form */
              <Card>
                <CardHeader>
                  <CardTitle>Create Contract</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Project</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.project_name} - {p.client_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contract Value ($)</Label>
                    <Input
                      type="number"
                      value={formData.contract_value}
                      onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                      placeholder="Enter contract value"
                    />
                  </div>
                  <div>
                    <Label>Financing Type</Label>
                    <Select
                      value={formData.financing_type}
                      onValueChange={(value) => setFormData({ ...formData, financing_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="lender">Lender</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.financing_type !== 'cash' && (
                    <div>
                      <Label>Lender Name</Label>
                      <Input
                        value={formData.lender_name}
                        onChange={(e) => setFormData({ ...formData, lender_name: e.target.value })}
                        placeholder="e.g., GreenSky, Hearth"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <Button 
                    onClick={() => createContractMutation.mutate()}
                    disabled={!formData.project_id || !formData.contract_value || createContractMutation.isPending}
                    className="w-full"
                  >
                    Create Contract
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Existing Contract View */
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">
                    <FileText className="h-4 w-4 mr-2" /> Details
                  </TabsTrigger>
                  <TabsTrigger value="schedule">
                    <DollarSign className="h-4 w-4 mr-2" /> Payment Schedule
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Contract Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Contract Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Contract Value</p>
                            <p className="text-xl font-bold">${Number(contract?.contract_value).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Financing Type</p>
                            <p className="font-medium capitalize">{contract?.financing_type}</p>
                            {contract?.lender_name && (
                              <p className="text-sm text-muted-foreground">{contract.lender_name}</p>
                            )}
                          </div>
                        </div>
                        {contract?.signed_at && (
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Signed At</p>
                              <p className="font-medium">{format(new Date(contract.signed_at), 'PPP')}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {contract?.signature_status === 'draft' && (
                          <Button 
                            className="w-full" 
                            onClick={() => updateStatusMutation.mutate('sent')}
                          >
                            <Send className="h-4 w-4 mr-2" /> Send for Signature
                          </Button>
                        )}
                        {contract?.signature_status === 'sent' && (
                          <>
                            <Button 
                              className="w-full" 
                              onClick={() => updateStatusMutation.mutate('signed')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Signed
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => updateStatusMutation.mutate('sent')}
                            >
                              <Send className="h-4 w-4 mr-2" /> Resend Request
                            </Button>
                          </>
                        )}
                        {contract?.signature_status === 'signed' && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => updateStatusMutation.mutate('amended')}
                          >
                            Amend Contract
                          </Button>
                        )}
                        {contract?.document_url && (
                          <Button variant="outline" className="w-full" asChild>
                            <a href={contract.document_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-2" /> View Document
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="schedule">
                  {contract && (
                    <PaymentSchedulePanel 
                      contractId={contract.id} 
                      contractValue={Number(contract.contract_value)} 
                    />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

import { ContractorSidebar } from "@/components/contractor/ContractorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FinanceSnapshot } from "@/components/finance/FinanceSnapshot";
import { ContractBillingPipeline } from "@/components/finance/ContractBillingPipeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/context/DemoModeContext";
import { useToast } from "@/hooks/use-toast";
import { getDemoFinancingCases, getDemoUnbilledChangeOrders } from "@/utils/demoContractorData";

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();

  // Get recent financing cases
  const { data: financingCases } = useQuery({
    queryKey: ['financing-cases-recent', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoFinancingCases();
      }
      const { data, error } = await supabase
        .from('financing_cases')
        .select(`
          *,
          projects(project_name, homeowner_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  // Get unbilled change orders
  const { data: unbilledCOs } = useQuery({
    queryKey: ['unbilled-change-orders', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoUnbilledChangeOrders();
      }
      const { data, error } = await supabase
        .from('change_orders')
        .select(`
          *,
          contractor_projects:project_id(project_name, homeowner_name)
        `)
        .eq('status', 'approved')
        .eq('billed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const getFinancingStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'funded':
        return <Badge className="bg-emerald-100 text-emerald-800">{status}</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800">In Review</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleDemoAction = (action: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: `${action} - This action is simulated in demo mode.`,
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ContractorSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold">Finance & Billing</h1>
                  <p className="text-muted-foreground">Manage contracts, billing, and collections</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  if (isDemoMode) {
                    handleDemoAction("View Reports");
                  } else {
                    navigate('/finance/reports');
                  }
                }}>
                  <TrendingUp className="h-4 w-4 mr-2" /> Reports
                </Button>
                <Button onClick={() => {
                  if (isDemoMode) {
                    handleDemoAction("Create New Contract");
                  } else {
                    navigate('/finance/contract/new');
                  }
                }}>
                  <Plus className="h-4 w-4 mr-2" /> New Contract
                </Button>
              </div>
            </div>

            {/* KPI Snapshot */}
            <FinanceSnapshot />

            {/* Main Content Tabs */}
            <Tabs defaultValue="pipeline" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pipeline">
                  <FileText className="h-4 w-4 mr-2" /> Billing Pipeline
                </TabsTrigger>
                <TabsTrigger value="financing">
                  <CreditCard className="h-4 w-4 mr-2" /> Financing Cases
                </TabsTrigger>
                <TabsTrigger value="change-orders">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Unbilled COs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pipeline">
                <ContractBillingPipeline />
              </TabsContent>

              <TabsContent value="financing">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Financing Cases</CardTitle>
                      <Button size="sm" onClick={() => handleDemoAction("Create New Financing Case")}>
                        <Plus className="h-4 w-4 mr-1" /> New Case
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {financingCases?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No financing cases</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {financingCases?.map((fc: any) => (
                          <div
                            key={fc.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleDemoAction(`View financing case for ${fc.homeowner_name || fc.projects?.homeowner_name}`)}
                          >
                            <div>
                              <p className="font-medium">{fc.homeowner_name || fc.projects?.homeowner_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {fc.lender} • ${Number(fc.loan_amount || 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              {getFinancingStatusBadge(fc.status)}
                              {fc.next_action && (
                                <span className="text-sm text-muted-foreground">{fc.next_action}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="change-orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Approved Change Orders (Unbilled)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unbilledCOs?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>All approved change orders have been billed</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {unbilledCOs?.map((co: any) => (
                          <div
                            key={co.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                          >
                            <div>
                              <p className="font-medium">{co.change_order_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {co.contractor_projects?.project_name || co.project_name} • {co.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-lg">
                                ${Number(co.change_amount).toLocaleString()}
                              </span>
                              <Button size="sm" variant="outline" onClick={() => handleDemoAction(`Bill change order ${co.change_order_number}`)}>
                                Bill CO
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

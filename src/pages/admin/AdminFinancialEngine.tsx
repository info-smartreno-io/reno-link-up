import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, CreditCard, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

function fmt(n: number) { return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`; }

export default function AdminFinancialEngine() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: financials, isLoading } = useQuery({
    queryKey: ["admin-financials-engine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_financials")
        .select("*, contractor_projects(client_name, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: milestones } = useQuery({
    queryKey: ["admin-milestones-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_milestones")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["admin-contractor-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalPipeline = financials?.reduce((s, f) => s + (f.estimated_project_value || 0), 0) || 0;
  const totalPaid = financials?.reduce((s, f) => s + (f.total_paid || 0), 0) || 0;
  const totalRemaining = financials?.reduce((s, f) => s + (f.remaining_balance || 0), 0) || 0;
  const totalFees = financials?.reduce((s, f) => s + (f.smartreno_platform_fee || 0), 0) || 0;
  const totalCOs = financials?.reduce((s, f) => s + (f.total_change_orders || 0), 0) || 0;
  const pendingMilestones = milestones?.filter(m => m.status === "pending").length || 0;

  if (isLoading) {
    return <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financial Engine</h1>
        <p className="text-sm text-muted-foreground">Platform-wide financial tracking and milestone management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Pipeline Value", value: fmt(totalPipeline), icon: TrendingUp, color: "text-blue-500" },
          { label: "Total Paid", value: fmt(totalPaid), icon: CreditCard, color: "text-green-500" },
          { label: "Remaining", value: fmt(totalRemaining), icon: DollarSign, color: "text-amber-500" },
          { label: "Platform Fees", value: fmt(totalFees), icon: ArrowUpRight, color: "text-purple-500" },
          { label: "Change Orders", value: fmt(totalCOs), icon: ArrowDownRight, color: "text-red-500" },
          { label: "Pending Milestones", value: String(pendingMilestones), icon: AlertTriangle, color: "text-orange-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Financials Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Project Financial Summaries</CardTitle>
            <span className="text-xs text-muted-foreground">{financials?.length || 0} projects</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Estimated</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Bid Value</TableHead>
                  <TableHead className="text-right">Platform Fee</TableHead>
                  <TableHead className="text-right">COs</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financials?.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-sm">
                      {f.contractor_projects?.client_name || "—"}
                      <Badge variant="outline" className="ml-2 text-xs">{f.contractor_projects?.status || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmt(f.estimated_project_value || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(f.approved_project_value || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(f.contractor_bid_value || 0)}</TableCell>
                    <TableCell className="text-right text-sm text-purple-500">{fmt(f.smartreno_platform_fee || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(f.total_change_orders || 0)}</TableCell>
                    <TableCell className="text-right text-sm text-green-500">{fmt(f.total_paid || 0)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(f.remaining_balance || 0)}</TableCell>
                  </TableRow>
                ))}
                {(!financials || financials.length === 0) && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No financial records yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Milestones */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payment Milestones</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Payee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones
                ?.filter(m => statusFilter === "all" || m.status === statusFilter)
                .map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-sm">{m.milestone_name}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(m.amount || 0)}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === "paid" ? "default" : m.status === "overdue" ? "destructive" : "secondary"} className="text-xs">
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{m.due_date || "—"}</TableCell>
                  <TableCell className="text-sm">{m.paid_date || "—"}</TableCell>
                  <TableCell className="text-sm">{m.payer || "—"}</TableCell>
                  <TableCell className="text-sm">{m.payee || "—"}</TableCell>
                </TableRow>
              ))}
              {(!milestones || milestones.length === 0) && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No milestones yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

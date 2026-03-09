import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function fmt(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  submitted: "default",
  approved: "default",
  rejected: "destructive",
  completed: "default",
};

export default function AdminChangeOrdersManager() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ["admin-change-orders-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("change_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "approved") {
        const { data: { user } } = await supabase.auth.getUser();
        updates.approved_by = user?.id;
        updates.approved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("change_orders").update(updates).eq("id", id);
      if (error) throw error;

      // Update project financials if approved
      if (status === "approved") {
        const co = changeOrders?.find(c => c.id === id);
        if (co?.project_id) {
          const { data: fin } = await supabase.from("project_financials").select("*").eq("project_id", co.project_id).maybeSingle();
          if (fin) {
            await supabase.from("project_financials").update({
              total_change_orders: (fin.total_change_orders || 0) + (co.change_amount || 0),
              remaining_balance: (fin.remaining_balance || 0) + (co.change_amount || 0),
            }).eq("id", fin.id);
          }
          // Flag timeline for refresh
          await supabase.from("contractor_projects").update({ timeline_needs_refresh: true }).eq("id", co.project_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-change-orders-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financials-engine"] });
      toast.success("Change order updated");
    },
  });

  const filtered = changeOrders?.filter(co => statusFilter === "all" || co.status === statusFilter) || [];
  const totalApproved = changeOrders?.filter(co => co.status === "approved").reduce((s, co) => s + (co.change_amount || 0), 0) || 0;
  const pendingCount = changeOrders?.filter(co => co.status === "submitted" || co.status === "draft").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Change Order Management</h1>
        <p className="text-sm text-muted-foreground">Track, approve, and manage all project change orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Approved COs</p>
              <p className="text-lg font-bold">{fmt(totalApproved)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
              <p className="text-lg font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total COs</p>
              <p className="text-lg font-bold">{changeOrders?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Change Orders</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CO #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((co: any) => (
                <TableRow key={co.id}>
                  <TableCell className="font-mono text-sm">{co.change_order_number}</TableCell>
                  <TableCell className="text-sm">{co.project_name || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{co.description}</TableCell>
                  <TableCell className={`text-right text-sm font-medium ${co.change_amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {fmt(co.change_amount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[co.status] as any || "secondary"} className="text-xs">{co.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {co.created_at ? new Date(co.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {(co.status === "submitted" || co.status === "draft") && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-500" onClick={() => updateStatus.mutate({ id: co.id, status: "approved" })}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => updateStatus.mutate({ id: co.id, status: "rejected" })}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No change orders found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

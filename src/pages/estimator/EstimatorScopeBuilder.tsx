import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, Calendar, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

interface ScopeItem {
  id?: string;
  cost_code: string;
  description: string;
  trade: string;
  quantity: number;
  unit: string;
  labor_cost_low: number;
  labor_cost_high: number;
  material_cost_low: number;
  material_cost_high: number;
  notes: string;
  is_ai_generated?: boolean;
  schedule_phase?: string;
  estimated_duration_days?: number;
  total_estimated_cost?: number;
}

function fmt(n: number) { return `$${n.toLocaleString()}`; }

export default function EstimatorScopeBuilder() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [newItem, setNewItem] = useState<Partial<ScopeItem>>({});
  const [editItem, setEditItem] = useState<ScopeItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: scopeItems, isLoading } = useQuery({
    queryKey: ["scope-items", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("scope_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scope_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scope-items", projectId] });
      toast.success("Item removed");
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: Partial<ScopeItem>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const totalEst = ((item.labor_cost_low || 0) + (item.labor_cost_high || 0)) / 2 + ((item.material_cost_low || 0) + (item.material_cost_high || 0)) / 2;
      const { error } = await supabase.from("scope_items").insert({
        project_id: projectId,
        cost_code: item.cost_code || "CUSTOM",
        description: item.description || "",
        trade: item.trade || "General",
        quantity: item.quantity || 1,
        unit: item.unit || "EA",
        labor_cost_low: item.labor_cost_low || 0,
        labor_cost_high: item.labor_cost_high || 0,
        material_cost_low: item.material_cost_low || 0,
        material_cost_high: item.material_cost_high || 0,
        notes: item.notes || "",
        is_ai_generated: false,
        created_by: user?.id,
        total_estimated_cost: totalEst,
        schedule_phase: item.schedule_phase || null,
        estimated_duration_days: item.estimated_duration_days || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scope-items", projectId] });
      setNewItem({});
      toast.success("Item added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: ScopeItem) => {
      const totalEst = ((item.labor_cost_low || 0) + (item.labor_cost_high || 0)) / 2 + ((item.material_cost_low || 0) + (item.material_cost_high || 0)) / 2;
      const { error } = await supabase.from("scope_items").update({
        cost_code: item.cost_code,
        description: item.description,
        trade: item.trade,
        quantity: item.quantity,
        unit: item.unit,
        labor_cost_low: item.labor_cost_low,
        labor_cost_high: item.labor_cost_high,
        material_cost_low: item.material_cost_low,
        material_cost_high: item.material_cost_high,
        notes: item.notes,
        total_estimated_cost: totalEst,
        schedule_phase: item.schedule_phase || null,
        estimated_duration_days: item.estimated_duration_days || null,
      }).eq("id", item.id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scope-items", projectId] });
      setEditOpen(false);
      setEditItem(null);
      toast.success("Item updated");
    },
  });

  // Generate Financial Summary from scope totals
  const generateFinancials = useMutation({
    mutationFn: async () => {
      if (!scopeItems?.length) throw new Error("No scope items to generate financials from");
      const totalLow = scopeItems.reduce((s, i) => s + (i.labor_cost_low || 0) + (i.material_cost_low || 0), 0);
      const totalHigh = scopeItems.reduce((s, i) => s + (i.labor_cost_high || 0) + (i.material_cost_high || 0), 0);
      const estimated = (totalLow + totalHigh) / 2;
      const platformFee = estimated * 0.15; // 15% platform fee

      // Upsert: check if financial record exists
      const { data: existing } = await supabase.from("project_financials").select("id").eq("project_id", projectId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("project_financials").update({
          estimated_project_value: estimated,
          remaining_balance: estimated,
          smartreno_platform_fee: platformFee,
        }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_financials").insert({
          project_id: projectId,
          estimated_project_value: estimated,
          remaining_balance: estimated,
          smartreno_platform_fee: platformFee,
          total_paid: 0,
          total_change_orders: 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => toast.success("Financial summary generated from scope totals"),
    onError: (e: any) => toast.error(e.message),
  });

  // Generate Timeline from scope items
  const generateTimeline = useMutation({
    mutationFn: async () => {
      if (!scopeItems?.length) throw new Error("No scope items to generate timeline from");

      // Delete old schedule entries for this project
      await supabase.from("project_schedule").delete().eq("project_id", projectId);

      // Group by trade/phase, accumulate durations
      const TRADE_ORDER = ["Demolition", "Framing", "Plumbing", "Electrical", "HVAC", "Insulation", "Drywall", "Cabinets", "Countertops", "Tile", "Flooring", "Painting", "Trim", "Fixtures", "General"];
      const tradeGroups: Record<string, { items: typeof scopeItems; totalDays: number }> = {};

      scopeItems.forEach(item => {
        const trade = item.trade || "General";
        if (!tradeGroups[trade]) tradeGroups[trade] = { items: [], totalDays: 0 };
        tradeGroups[trade].items.push(item);
        tradeGroups[trade].totalDays += (item.estimated_duration_days || 2);
      });

      // Sort trades
      const sorted = Object.entries(tradeGroups).sort(([a], [b]) => {
        const ai = TRADE_ORDER.findIndex(t => a.toLowerCase().includes(t.toLowerCase()));
        const bi = TRADE_ORDER.findIndex(t => b.toLowerCase().includes(t.toLowerCase()));
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      const today = new Date();
      let currentDay = 0;
      const rows = sorted.map(([trade, group]) => {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + currentDay);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + group.totalDays);
        currentDay += group.totalDays;

        const costCodes = group.items.map(i => i.cost_code).join(", ");
        return {
          project_id: projectId,
          trade,
          phase: group.items[0]?.schedule_phase || trade,
          cost_code: costCodes.slice(0, 50),
          duration_days: group.totalDays,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          status: "not_started",
        };
      });

      const { error } = await supabase.from("project_schedule").insert(rows);
      if (error) throw error;

      // Clear timeline_needs_refresh flag
      await supabase.from("contractor_projects").update({ timeline_needs_refresh: false }).eq("id", projectId);
    },
    onSuccess: () => toast.success("Project timeline generated from scope items"),
    onError: (e: any) => toast.error(e.message),
  });

  const totalLow = scopeItems?.reduce((s, i) => s + (i.labor_cost_low || 0) + (i.material_cost_low || 0), 0) || 0;
  const totalHigh = scopeItems?.reduce((s, i) => s + (i.labor_cost_high || 0) + (i.material_cost_high || 0), 0) || 0;
  const totalDays = scopeItems?.reduce((s, i) => s + (i.estimated_duration_days || 0), 0) || 0;

  if (!projectId) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Select a project to build its scope. Use the project dashboard to navigate here.
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Scope Builder</h1>
          <p className="text-sm text-muted-foreground">
            {scopeItems?.length || 0} items • Est. Range: {fmt(totalLow)} – {fmt(totalHigh)} • ~{totalDays} days
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => generateFinancials.mutate()} disabled={generateFinancials.isPending || !scopeItems?.length}>
            {generateFinancials.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <DollarSign className="h-4 w-4 mr-1" />}
            Generate Financials
          </Button>
          <Button size="sm" variant="outline" onClick={() => generateTimeline.mutate()} disabled={generateTimeline.isPending || !scopeItems?.length}>
            {generateTimeline.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Calendar className="h-4 w-4 mr-1" />}
            Generate Timeline
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Scope Items</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Labor (L-H)</TableHead>
                  <TableHead className="text-right">Material (L-H)</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopeItems?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.cost_code}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{item.description}</TableCell>
                    <TableCell className="text-sm">{item.trade}</TableCell>
                    <TableCell className="text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-sm">{item.unit}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(item.labor_cost_low || 0)} – {fmt(item.labor_cost_high || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(item.material_cost_low || 0)} – {fmt(item.material_cost_high || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_ai_generated ? "default" : "secondary"} className="text-xs">
                        {item.is_ai_generated ? "AI" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(item); setEditOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Add row */}
                <TableRow>
                  <TableCell><Input value={newItem.cost_code || ""} onChange={e => setNewItem(p => ({ ...p, cost_code: e.target.value }))} placeholder="Code" className="h-7 text-xs w-20" /></TableCell>
                  <TableCell><Input value={newItem.description || ""} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="h-7 text-xs" /></TableCell>
                  <TableCell><Input value={newItem.trade || ""} onChange={e => setNewItem(p => ({ ...p, trade: e.target.value }))} placeholder="Trade" className="h-7 text-xs w-24" /></TableCell>
                  <TableCell><Input type="number" value={newItem.quantity || ""} onChange={e => setNewItem(p => ({ ...p, quantity: Number(e.target.value) }))} placeholder="1" className="h-7 text-xs w-14" /></TableCell>
                  <TableCell><Input value={newItem.unit || ""} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} placeholder="EA" className="h-7 text-xs w-14" /></TableCell>
                  <TableCell><Input placeholder="L-H" className="h-7 text-xs w-20" onChange={e => { const [l, h] = e.target.value.split("-").map(Number); setNewItem(p => ({ ...p, labor_cost_low: l || 0, labor_cost_high: h || l || 0 })); }} /></TableCell>
                  <TableCell><Input placeholder="L-H" className="h-7 text-xs w-20" onChange={e => { const [l, h] = e.target.value.split("-").map(Number); setNewItem(p => ({ ...p, material_cost_low: l || 0, material_cost_high: h || l || 0 })); }} /></TableCell>
                  <TableCell colSpan={2}>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => addMutation.mutate(newItem)} disabled={!newItem.description}>
                      <Plus className="h-3 w-3 mr-1" />Add
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Scope Item</DialogTitle>
            <DialogDescription>Update this scope item's details.</DialogDescription>
          </DialogHeader>
          {editItem && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cost Code</Label>
                <Input value={editItem.cost_code} onChange={e => setEditItem({ ...editItem, cost_code: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Trade</Label>
                <Input value={editItem.trade} onChange={e => setEditItem({ ...editItem, trade: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Input value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input type="number" value={editItem.quantity} onChange={e => setEditItem({ ...editItem, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Input value={editItem.unit} onChange={e => setEditItem({ ...editItem, unit: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Labor Low</Label>
                <Input type="number" value={editItem.labor_cost_low} onChange={e => setEditItem({ ...editItem, labor_cost_low: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Labor High</Label>
                <Input type="number" value={editItem.labor_cost_high} onChange={e => setEditItem({ ...editItem, labor_cost_high: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Material Low</Label>
                <Input type="number" value={editItem.material_cost_low} onChange={e => setEditItem({ ...editItem, material_cost_low: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Material High</Label>
                <Input type="number" value={editItem.material_cost_high} onChange={e => setEditItem({ ...editItem, material_cost_high: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Schedule Phase</Label>
                <Input value={editItem.schedule_phase || ""} onChange={e => setEditItem({ ...editItem, schedule_phase: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Duration (days)</Label>
                <Input type="number" value={editItem.estimated_duration_days || ""} onChange={e => setEditItem({ ...editItem, estimated_duration_days: Number(e.target.value) || undefined })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea value={editItem.notes || ""} onChange={e => setEditItem({ ...editItem, notes: e.target.value })} rows={2} />
              </div>
              <div className="col-span-2">
                <Button className="w-full" onClick={() => updateMutation.mutate(editItem)} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

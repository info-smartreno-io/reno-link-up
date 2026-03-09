import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Brain, Loader2 } from "lucide-react";
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scope-items", projectId] });
      setNewItem({});
      toast.success("Item added");
    },
  });

  const totalLow = scopeItems?.reduce((s, i) => s + (i.labor_cost_low || 0) + (i.material_cost_low || 0), 0) || 0;
  const totalHigh = scopeItems?.reduce((s, i) => s + (i.labor_cost_high || 0) + (i.material_cost_high || 0), 0) || 0;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scope Builder</h1>
          <p className="text-sm text-muted-foreground">
            {scopeItems?.length || 0} items • Est. Range: {fmt(totalLow)} – {fmt(totalHigh)}
          </p>
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
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
    </div>
  );
}

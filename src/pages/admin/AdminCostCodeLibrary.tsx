import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Pencil, Trash2, Calculator, Layers, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TRADES = [
  "Demolition", "Framing", "Plumbing", "Electrical", "HVAC",
  "Drywall", "Painting", "Flooring", "Cabinets", "Countertops",
  "Tile", "Roofing", "Siding", "Windows & Doors", "Insulation",
  "Concrete", "Masonry", "Landscaping", "General Conditions", "Other"
];

const CATEGORIES = [
  "Site Work", "Structural", "Exterior", "Interior Finishes",
  "Mechanical", "Electrical", "Plumbing", "Kitchen", "Bathroom",
  "Basement", "Addition", "General"
];

const SCHEDULE_PHASES = [
  "Pre-Construction", "Demolition", "Rough-In", "Framing",
  "Mechanical Rough", "Inspections", "Insulation & Drywall",
  "Finishes", "Trim & Install", "Final", "Punch List"
];

const UNITS = ["EA", "SF", "LF", "SY", "CY", "HR", "DAY", "LS", "GAL", "TON"];

interface CostCodeForm {
  cost_code: string;
  category: string;
  subcategory: string;
  description: string;
  trade: string;
  unit_type: string;
  labor_cost_low: number;
  labor_cost_high: number;
  material_cost_low: number;
  material_cost_high: number;
  estimated_duration_days: number;
  trade_dependency: string;
  schedule_phase: string;
}

const emptyForm: CostCodeForm = {
  cost_code: "", category: "", subcategory: "", description: "",
  trade: "", unit_type: "EA", labor_cost_low: 0, labor_cost_high: 0,
  material_cost_low: 0, material_cost_high: 0, estimated_duration_days: 0,
  trade_dependency: "", schedule_phase: "",
};

export default function AdminCostCodeLibrary() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CostCodeForm>(emptyForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: costCodes, isLoading } = useQuery({
    queryKey: ["platform-cost-codes", search, categoryFilter, tradeFilter],
    queryFn: async () => {
      let q = supabase
        .from("platform_cost_codes")
        .select("*")
        .eq("is_active", true)
        .order("cost_code", { ascending: true })
        .limit(500);

      if (search) {
        q = q.or(`cost_code.ilike.%${search}%,description.ilike.%${search}%,trade.ilike.%${search}%`);
      }
      if (categoryFilter !== "all") q = q.eq("category", categoryFilter);
      if (tradeFilter !== "all") q = q.eq("trade", tradeFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-cost-code-stats"],
    queryFn: async () => {
      const [totalRes, tradesRes] = await Promise.all([
        supabase.from("platform_cost_codes").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("platform_cost_codes").select("trade").eq("is_active", true),
      ]);
      const uniqueTrades = new Set(tradesRes.data?.map(r => r.trade) || []);
      const uniqueCategories = new Set(tradesRes.data?.map((r: any) => r.category) || []);
      return {
        total: totalRes.count ?? 0,
        trades: uniqueTrades.size,
        categories: uniqueCategories.size,
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CostCodeForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from("platform_cost_codes").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("platform_cost_codes").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-cost-codes"] });
      queryClient.invalidateQueries({ queryKey: ["platform-cost-code-stats"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: editingId ? "Cost Code Updated" : "Cost Code Added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_cost_codes").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-cost-codes"] });
      queryClient.invalidateQueries({ queryKey: ["platform-cost-code-stats"] });
      toast({ title: "Cost Code Removed" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (cc: any) => {
    setForm({
      cost_code: cc.cost_code, category: cc.category, subcategory: cc.subcategory || "",
      description: cc.description, trade: cc.trade, unit_type: cc.unit_type,
      labor_cost_low: cc.labor_cost_low, labor_cost_high: cc.labor_cost_high,
      material_cost_low: cc.material_cost_low, material_cost_high: cc.material_cost_high,
      estimated_duration_days: cc.estimated_duration_days || 0,
      trade_dependency: cc.trade_dependency || "", schedule_phase: cc.schedule_phase || "",
    });
    setEditingId(cc.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.cost_code || !form.description || !form.trade || !form.category) {
      toast({ title: "Missing Fields", description: "Code, description, trade, and category are required.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Master Cost Code Library</h1>
            <p className="text-muted-foreground">Platform-wide cost codes powering all scopes and estimates</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Cost Code
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Cost Codes", value: stats?.total ?? 0, icon: Calculator },
            { label: "Trade Categories", value: stats?.trades ?? 0, icon: Layers },
            { label: "Categories", value: stats?.categories ?? 0, icon: Package },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  </div>
                  <Icon className="h-6 w-6 text-muted-foreground opacity-50" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search codes, descriptions, trades..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Labor Range</TableHead>
                  <TableHead>Material Range</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : costCodes?.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No cost codes found. Add your first code above.</TableCell></TableRow>
                ) : (
                  costCodes?.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-mono text-sm font-medium">{cc.cost_code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{cc.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{cc.category}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{cc.trade}</Badge></TableCell>
                      <TableCell>{cc.unit_type}</TableCell>
                      <TableCell className="font-mono text-xs">${cc.labor_cost_low}–${cc.labor_cost_high}</TableCell>
                      <TableCell className="font-mono text-xs">${cc.material_cost_low}–${cc.material_cost_high}</TableCell>
                      <TableCell>{cc.estimated_duration_days ? `${cc.estimated_duration_days}d` : "—"}</TableCell>
                      <TableCell className="text-xs">{cc.schedule_phase || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cc)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(cc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Cost Code" : "Add Cost Code"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Code *</Label>
                <Input placeholder="e.g. 06.01.02" value={form.cost_code} onChange={e => setForm(f => ({ ...f, cost_code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Input placeholder="e.g. Wall Removal" value={form.subcategory} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Trade *</Label>
                <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                  <SelectContent>{TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description *</Label>
                <Textarea placeholder="Detailed description of work item..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Unit Type</Label>
                <Select value={form.unit_type} onValueChange={v => setForm(f => ({ ...f, unit_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Schedule Phase</Label>
                <Select value={form.schedule_phase} onValueChange={v => setForm(f => ({ ...f, schedule_phase: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger>
                  <SelectContent>{SCHEDULE_PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Labor Cost Low ($)</Label>
                <Input type="number" value={form.labor_cost_low} onChange={e => setForm(f => ({ ...f, labor_cost_low: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Labor Cost High ($)</Label>
                <Input type="number" value={form.labor_cost_high} onChange={e => setForm(f => ({ ...f, labor_cost_high: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Material Cost Low ($)</Label>
                <Input type="number" value={form.material_cost_low} onChange={e => setForm(f => ({ ...f, material_cost_low: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Material Cost High ($)</Label>
                <Input type="number" value={form.material_cost_high} onChange={e => setForm(f => ({ ...f, material_cost_high: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Est. Duration (days)</Label>
                <Input type="number" value={form.estimated_duration_days} onChange={e => setForm(f => ({ ...f, estimated_duration_days: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Trade Dependency</Label>
                <Input placeholder="e.g. Framing must complete first" value={form.trade_dependency} onChange={e => setForm(f => ({ ...f, trade_dependency: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Add Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

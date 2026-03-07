import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Package, Search, Filter } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AdminDesignPackageDetail } from "@/components/admin/AdminDesignPackageDetail";

const STATUS_OPTIONS = ["draft", "in_progress", "review", "approved", "revision_requested", "ready_for_rfp"];

export default function AdminDesignPackages() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rfpFilter, setRfpFilter] = useState<string>("all");
  const [permitFilter, setPermitFilter] = useState<string>("all");
  const [renderingsFilter, setRenderingsFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const { data: packages, isLoading, refetch } = useQuery({
    queryKey: ["admin-design-packages", statusFilter, rfpFilter, permitFilter, renderingsFilter],
    queryFn: async () => {
      let query = supabase
        .from("design_packages")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") query = query.eq("package_status", statusFilter);
      if (rfpFilter === "yes") query = query.eq("ready_for_rfp", true);
      if (rfpFilter === "no") query = query.eq("ready_for_rfp", false);
      if (permitFilter === "yes") query = query.eq("permit_required", true);
      if (permitFilter === "no") query = query.eq("permit_required", false);
      if (renderingsFilter === "yes") query = query.eq("renderings_required", true);
      if (renderingsFilter === "no") query = query.eq("renderings_required", false);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles for display names
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-lookup"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data || [];
    },
  });

  const getProfileName = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = profiles?.find((pr) => pr.id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "draft": return "secondary";
      case "in_progress": return "default";
      case "review": return "outline";
      case "approved": return "default";
      case "revision_requested": return "destructive";
      case "ready_for_rfp": return "default";
      default: return "secondary";
    }
  };

  const filtered = (packages || []).filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.id.toLowerCase().includes(term) ||
      p.project_id?.toLowerCase().includes(term) ||
      getProfileName(p.assigned_design_professional_id).toLowerCase().includes(term) ||
      getProfileName(p.assigned_estimator_id).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" /> Design Package Queue</h1>
          <p className="text-muted-foreground">Review, assign, and approve design packages</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">{filtered.length} packages</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="ID, project, name…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Permit Required</Label>
              <Select value={permitFilter} onValueChange={setPermitFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Renderings Required</Label>
              <Select value={renderingsFilter} onValueChange={setRenderingsFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ready for RFP</Label>
              <Select value={rfpFilter} onValueChange={setRfpFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No design packages found matching filters.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((pkg) => (
            <Card key={pkg.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedPackageId(pkg.id)}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-sm">Package {pkg.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">Project: {pkg.project_id?.slice(0, 8) || "—"}</p>
                    </div>
                    <Badge variant={statusColor(pkg.package_status)}>{pkg.package_status.replace(/_/g, " ")}</Badge>
                    {pkg.ready_for_rfp && <Badge variant="default" className="bg-green-600">RFP Ready</Badge>}
                    {pkg.admin_override_rfp && <Badge variant="outline" className="border-amber-500 text-amber-600">Override</Badge>}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Completion</p>
                      <p className="font-semibold">{pkg.package_completion_percent ?? 0}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Designer</p>
                      <p className="font-medium">{getProfileName(pkg.assigned_design_professional_id)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Estimator</p>
                      <p className="font-medium">{getProfileName(pkg.assigned_estimator_id)}</p>
                    </div>
                    <div className="flex gap-1">
                      {pkg.permit_required && <Badge variant="outline" className="text-xs">Permit</Badge>}
                      {pkg.renderings_required && <Badge variant="outline" className="text-xs">Renderings</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedPackageId} onOpenChange={(open) => !open && setSelectedPackageId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPackageId && (
            <AdminDesignPackageDetail
              packageId={selectedPackageId}
              onClose={() => { setSelectedPackageId(null); refetch(); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

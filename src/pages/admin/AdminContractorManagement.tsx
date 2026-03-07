import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminContractors } from "@/hooks/useAdminContractors";
import { Search, CheckCircle, XCircle, Eye, Clock, FileText, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminContractorManagement() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const { data: contractors, isLoading, updateActive } = useAdminContractors(filter);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filtered = contractors?.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleApproval = async (id: string, status: "approved" | "rejected" | "needs_info") => {
    const updates: any = {
      approval_status: status,
      approval_notes: approvalNotes || null,
      is_active: status === "approved",
    };
    if (status === "approved") {
      const { data: { user } } = await supabase.auth.getUser();
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user?.id;
    }
    const { error } = await supabase.from("contractors").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-contractors"] });
    toast({ title: "Updated", description: `Contractor ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "flagged for more info"}.` });
    setSelected({ ...selected, ...updates });
    setApprovalNotes("");
  };

  const getStatusBadge = (c: any) => {
    const status = c.approval_status || (c.is_active ? "approved" : "pending");
    switch (status) {
      case "approved": return <Badge className="bg-accent text-accent-foreground">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "needs_info": return <Badge variant="outline" className="border-primary/30 text-primary">Needs Info</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contractor Management</h1>
          <p className="text-muted-foreground">Review, approve, and monitor the contractor network</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contractors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive / Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Trade Focus</TableHead>
                  <TableHead>Service Areas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Profile %</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No contractors found</TableCell></TableRow>
                ) : (
                  filtered?.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => { setSelected(c); setApprovalNotes(""); }}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.owner_name || "—"}</TableCell>
                      <TableCell>{c.trade_focus || "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{c.service_areas?.join(", ") || "—"}</TableCell>
                      <TableCell>{getStatusBadge(c)}</TableCell>
                      <TableCell>{c.license_number || "—"}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${(c.profile_completion_pct || 0) >= 80 ? "text-accent" : "text-muted-foreground"}`}>
                          {c.profile_completion_pct || 0}%
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(c); setApprovalNotes(""); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Contractor Review</SheetTitle></SheetHeader>
          {selected && (
            <Tabs defaultValue="profile" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                <TabsTrigger value="operations" className="flex-1">Operations</TabsTrigger>
                <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
                <TabsTrigger value="approval" className="flex-1">Approval</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Company", selected.name],
                    ["Legal Name", selected.legal_name],
                    ["Owner", selected.owner_name],
                    ["Contact", selected.contact_name],
                    ["Contact Role", selected.contact_role],
                    ["Email", selected.email || selected.business_email],
                    ["Phone", selected.phone || selected.business_phone],
                    ["Website", selected.website],
                    ["Business Type", selected.business_type],
                    ["Trade Focus", selected.trade_focus],
                    ["License #", selected.license_number],
                    ["License Exp.", selected.license_expiration],
                    ["Bonded", selected.is_bonded ? "Yes" : "No"],
                    ["Workers Comp", selected.workers_comp_verified ? "Yes" : "No"],
                    ["Crew Size", selected.crew_size],
                    ["Google Rating", selected.google_rating ? `${selected.google_rating} ★ (${selected.google_review_count} reviews)` : "—"],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground">{(value as string) || "—"}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service Areas</p>
                  <p className="text-sm text-foreground">{selected.service_areas?.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ZIP Codes</p>
                  <p className="text-sm text-foreground">{selected.service_zip_codes?.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Project Types</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selected.project_types || []).map((t: string) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                    {(!selected.project_types || selected.project_types.length === 0) && <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="operations" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Office Staff", selected.office_staff_count],
                    ["Project Managers", selected.project_manager_count],
                    ["Estimators", selected.estimator_count],
                    ["Lead Foremen", selected.lead_foreman_count],
                    ["Designers", selected.has_in_house_designer ? selected.designer_count : "No"],
                    ["Work Type", selected.work_type],
                    ["Uses Subs", selected.uses_subcontractors ? "Yes" : "No"],
                    ["Concurrent Projects", selected.concurrent_projects],
                    ["Operating Days", selected.operating_days === "mon_fri" ? "Mon–Fri" : selected.operating_days === "mon_sat" ? "Mon–Sat" : selected.operating_days === "7_days" ? "7 Days" : selected.operating_days],
                    ["Hours", selected.operating_hours_start && selected.operating_hours_end ? `${selected.operating_hours_start} – ${selected.operating_hours_end}` : "—"],
                    ["Bid Turnaround", selected.bid_turnaround],
                    ["Avg Projects/Year", selected.avg_projects_per_year],
                    ["Typical Budget", selected.typical_budget_range],
                    ["Typical Duration", selected.typical_project_duration],
                    ["Largest Project $", selected.largest_project_value ? `$${Number(selected.largest_project_value).toLocaleString()}` : "—"],
                    ["Largest Duration", selected.largest_project_duration],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
                {selected.uses_subcontractors && (selected.subcontracted_trades?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Subcontracted Trades</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.subcontracted_trades.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Social Links</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      ["Google", selected.google_business_url],
                      ["Instagram", selected.instagram_url],
                      ["Facebook", selected.facebook_url],
                      ["LinkedIn", selected.linkedin_url],
                      ["Houzz", selected.houzz_url],
                    ].filter(([, url]) => url).map(([label, url]) => (
                      <a key={label as string} href={url as string} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent/10">
                          {label} <ExternalLink className="h-3 w-3 ml-1" />
                        </Badge>
                      </a>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Uploaded documents and compliance files.</p>
                {[
                  ["Contract Sample", selected.contract_sample_url],
                  ["Estimate Sample", selected.estimate_sample_url],
                ].map(([label, url]) => (
                  <div key={label as string} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {url ? <CheckCircle className="h-4 w-4 text-accent" /> : <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm text-foreground">{label}</span>
                    </div>
                    {url ? (
                      <a href={url as string} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><FileText className="h-3 w-3 mr-1" /> View</Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not uploaded</span>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {selected.tos_accepted_at ? <ShieldCheck className="h-4 w-4 text-accent" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                    <span className="text-sm text-foreground">Terms of Service</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selected.tos_accepted_at ? `Accepted ${format(new Date(selected.tos_accepted_at), "MMM d, yyyy")} (v${selected.tos_version || "1.0"})` : "Not accepted"}
                  </span>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Profile Completion</p>
                  <p className="text-lg font-bold text-foreground">{selected.profile_completion_pct || 0}%</p>
                </div>
              </TabsContent>

              <TabsContent value="approval" className="space-y-4 mt-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Current Status</span>
                    {getStatusBadge(selected)}
                  </div>
                  {selected.approval_notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Previous Notes</p>
                      <p className="text-sm text-foreground">{selected.approval_notes}</p>
                    </div>
                  )}
                  {selected.approved_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Approved At</p>
                      <p className="text-sm text-foreground">{format(new Date(selected.approved_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Approval Notes</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={e => setApprovalNotes(e.target.value)}
                    placeholder="Add notes about this contractor..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproval(selected.id, "approved")}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(selected.id, "needs_info")}
                  >
                    <Clock className="h-4 w-4 mr-1" /> Request More Info
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleApproval(selected.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

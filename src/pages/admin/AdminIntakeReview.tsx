import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminIntake } from "@/hooks/useAdminIntake";
import { useIntakeSiteVisits, fetchIntakeProjectDetails } from "@/hooks/useIntakeSiteVisits";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const statuses = [
  { value: "all", label: "All Statuses" },
  { value: "new_lead", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "walkthrough_scheduled", label: "Walkthrough Scheduled" },
  { value: "estimate_in_progress", label: "Estimate In Progress" },
  { value: "estimate_sent", label: "Estimate Sent" },
  { value: "lost", label: "Lost" },
];

function statusColor(status: string) {
  switch (status) {
    case "new_lead": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "contacted": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "walkthrough_scheduled": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "estimate_in_progress": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
    case "estimate_sent": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "lost": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function AdminIntakeReview() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedIntakeProjectId, setSelectedIntakeProjectId] = useState<string | null>(null);
  const { data: leads, isLoading, updateStatus } = useAdminIntake(statusFilter);
  const { data: intakeVisits = [], isLoading: intakeLoading, isError: intakeError } = useIntakeSiteVisits();

  const filtered = leads?.filter((l) =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Intake Review</h1>
          <p className="text-muted-foreground">Review and manage new homeowner submissions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Project Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No intakes found</TableCell></TableRow>
                ) : (
                  filtered?.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                      <TableCell>{lead.project_type || "—"}</TableCell>
                      <TableCell>{lead.location || "—"}</TableCell>
                      <TableCell>{lead.estimated_budget ? `$${Number(lead.estimated_budget).toLocaleString()}` : "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(lead.status || "")}>{lead.status?.replace(/_/g, " ") || "new"}</Badge>
                      </TableCell>
                      <TableCell>{lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}>
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

        {/* Homeowner-scheduled site visits (intake projects with visit_confirmed) */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Homeowner-scheduled site visits</CardTitle>
            <CardDescription>
              Intake projects with a confirmed visit. Ready for estimator when details are complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Homeowner</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Scheduled visit</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intakeLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : intakeError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-destructive">
                      Could not load intake visits
                    </TableCell>
                  </TableRow>
                ) : !intakeVisits.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No homeowner-scheduled visits
                    </TableCell>
                  </TableRow>
                ) : (
                  intakeVisits.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelectedIntakeProjectId(p.id)}>
                      <TableCell className="font-medium">{p.homeowner?.full_name ?? "—"}</TableCell>
                      <TableCell>{p.name} · {p.project_type}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{p.address ?? "—"}</TableCell>
                      <TableCell>{p.scheduled_visit_at ? format(new Date(p.scheduled_visit_at), "MMM d, yyyy h:mm a") : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.hasDetails ? "secondary" : "outline"}>{p.hasDetails ? "Complete" : "Missing"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedIntakeProjectId(p.id); }}>
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

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Intake Detail</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{selectedLead.name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p>{selectedLead.email || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p>{selectedLead.phone || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Location</p><p>{selectedLead.location || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Project Type</p><p>{selectedLead.project_type || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Budget</p><p>{selectedLead.estimated_budget ? `$${Number(selectedLead.estimated_budget).toLocaleString()}` : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Notes</p><p className="text-sm">{selectedLead.notes || "No notes"}</p></div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["new_lead", "contacted", "walkthrough_scheduled", "estimate_in_progress", "estimate_sent", "lost"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedLead.status === s ? "default" : "outline"}
                      onClick={() => {
                        updateStatus.mutate({ id: selectedLead.id, status: s });
                        setSelectedLead({ ...selectedLead, status: s });
                      }}
                    >
                      {s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Intake visit detail sheet */}
      <AdminIntakeVisitDetailSheet
        projectId={selectedIntakeProjectId}
        onClose={() => setSelectedIntakeProjectId(null)}
      />
    </AdminLayout>
  );
}

function AdminIntakeVisitDetailSheet({ projectId, onClose }: { projectId: string | null; onClose: () => void }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-intake-visit-detail", projectId],
    queryFn: () => fetchIntakeProjectDetails(projectId!),
    enabled: !!projectId,
  });
  const project = data?.project ?? null;
  const details = data?.details ?? null;

  return (
    <Sheet open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Intake visit details</SheetTitle>
          <SheetDescription>Homeowner project and submitted details</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {isLoading && <div className="py-6 text-sm text-muted-foreground">Loading…</div>}
          {isError && (
            <div className="py-6 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {(error as Error)?.message ?? "Failed to load"}
            </div>
          )}
          {!isLoading && !isError && project && (
            <>
              <div className="space-y-1">
                <p className="text-sm font-medium">{project.homeowner?.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{project.homeowner?.email ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{project.homeowner?.phone ?? "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Project</span>
                <span>{project.name} · {project.project_type}</span>
                <span className="text-muted-foreground">Address</span>
                <span>{project.address ?? "—"}</span>
                <span className="text-muted-foreground">Scheduled visit</span>
                <span>{project.scheduled_visit_at ? format(new Date(project.scheduled_visit_at), "PPpp") : "—"}</span>
              </div>
              {!details ? (
                <p className="text-sm text-muted-foreground">Details not yet provided by homeowner.</p>
              ) : (
                <div className="space-y-3">
                  {details.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm whitespace-pre-wrap">{details.description}</p>
                    </div>
                  )}
                  {details.measurements && Object.keys(details.measurements).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Measurements</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(details.measurements, null, 2)}
                      </pre>
                      {Array.isArray((details.measurements as { photo_urls?: string[] }).photo_urls) &&
                        (details.measurements as { photo_urls: string[] }).photo_urls.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(details.measurements as { photo_urls: string[] }).photo_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                                Photo {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                  {details.materials && Object.keys(details.materials).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Materials</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(details.materials, null, 2)}
                      </pre>
                    </div>
                  )}
                  {details.inspiration_links && details.inspiration_links.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Inspiration links</p>
                      <ul className="text-xs space-y-1">
                        {details.inspiration_links.map((link, i) => (
                          <li key={i}>
                            <a href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminIntake } from "@/hooks/useAdminIntake";
import { Search, Eye, CheckCircle, Archive, MessageSquare } from "lucide-react";
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
  const { data: leads, isLoading, updateStatus } = useAdminIntake(statusFilter);

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
      </div>

      {/* Detail Sheet */}
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
    </AdminLayout>
  );
}

import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminRFPs } from "@/hooks/useAdminRFPs";
import { Search, Eye, Clock, Users } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const rfpStatuses = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function statusBadge(status: string) {
  switch (status) {
    case "draft": return "bg-muted text-muted-foreground";
    case "open": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "closed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function AdminRFPManagement() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const { data: rfps, isLoading, updateStatus } = useAdminRFPs(filter);

  const filtered = rfps?.filter((r) =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">RFP Management</h1>
            <p className="text-muted-foreground">Create, monitor, and manage contractor-facing RFPs</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search RFPs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {rfpStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bid Deadline</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Bids</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No RFPs found</TableCell></TableRow>
                ) : (
                  filtered?.map((rfp) => {
                    const daysLeft = differenceInDays(new Date(rfp.bid_deadline), new Date());
                    const bidCount = Array.isArray(rfp.bid_submissions) ? rfp.bid_submissions.length : 0;
                    return (
                      <TableRow key={rfp.id} className="cursor-pointer" onClick={() => setSelected(rfp)}>
                        <TableCell className="font-medium">{rfp.title}</TableCell>
                        <TableCell>{rfp.location}</TableCell>
                        <TableCell>{rfp.project_type}</TableCell>
                        <TableCell>{format(new Date(rfp.bid_deadline), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className={`h-3 w-3 ${daysLeft <= 2 ? "text-red-500" : "text-muted-foreground"}`} />
                            <span className={daysLeft <= 2 ? "text-red-500 font-medium" : ""}>{daysLeft > 0 ? `${daysLeft}d` : "Expired"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{bidCount}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge className={statusBadge(rfp.status)}>{rfp.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>RFP Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Title</p><p className="font-medium">{selected.title}</p></div>
                <div><p className="text-xs text-muted-foreground">Location</p><p>{selected.location}</p></div>
                <div><p className="text-xs text-muted-foreground">Type</p><p>{selected.project_type}</p></div>
                <div><p className="text-xs text-muted-foreground">Budget</p><p>{selected.estimated_budget ? `$${Number(selected.estimated_budget).toLocaleString()}` : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{selected.description || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Deadline</p><p>{format(new Date(selected.bid_deadline), "PPP")}</p></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Update Status</p>
                <div className="flex gap-2">
                  {["draft", "open", "closed"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? "default" : "outline"}
                      onClick={() => {
                        updateStatus.mutate({ id: selected.id, status: s });
                        setSelected({ ...selected, status: s });
                      }}
                    >
                      {s}
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

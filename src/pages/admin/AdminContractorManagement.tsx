import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminContractors } from "@/hooks/useAdminContractors";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";

export default function AdminContractorManagement() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const { data: contractors, isLoading, updateActive } = useAdminContractors(filter);

  const filtered = contractors?.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

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
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No contractors found</TableCell></TableRow>
                ) : (
                  filtered?.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.owner_name || "—"}</TableCell>
                      <TableCell>{c.trade_focus || "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{c.service_areas?.join(", ") || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "default" : "secondary"}>
                          {c.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.license_number || "—"}</TableCell>
                      <TableCell>{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(c); }}>
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
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Contractor Profile</SheetTitle></SheetHeader>
          {selected && (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium">{selected.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Legal Name</p><p>{selected.legal_name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Owner</p><p>{selected.owner_name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p>{selected.email || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p>{selected.phone || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Website</p><p>{selected.website || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Trade Focus</p><p>{selected.trade_focus || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Service Areas</p><p>{selected.service_areas?.join(", ") || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">License #</p><p>{selected.license_number || "—"}</p></div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selected.is_active ? "outline" : "default"}
                  onClick={() => {
                    updateActive.mutate({ id: selected.id, is_active: true });
                    setSelected({ ...selected, is_active: true });
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant={!selected.is_active ? "outline" : "destructive"}
                  onClick={() => {
                    updateActive.mutate({ id: selected.id, is_active: false });
                    setSelected({ ...selected, is_active: false });
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Suspend
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

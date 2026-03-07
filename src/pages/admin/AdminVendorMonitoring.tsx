import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Star, Package, Eye } from "lucide-react";
import { format } from "date-fns";

const categories = [
  "all", "cabinets", "countertops", "tile", "flooring", "plumbing fixtures",
  "appliances", "windows/doors", "roofing/siding", "lighting", "specialty",
];

export default function AdminVendorMonitoring() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-vendors-monitoring", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("vendors")
        .select("*")
        .order("company_name", { ascending: true })
        .limit(200);
      if (statusFilter !== "all") {
        q = q.eq("status", statusFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors-monitoring"] });
      toast.success("Vendor updated");
    },
  });

  const filtered = vendors?.filter((v) =>
    !search || v.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendor Monitoring</h1>
          <p className="text-muted-foreground">Track supplier relationships, materials, and lead times</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Vendors", value: vendors?.length ?? 0 },
            { label: "Active", value: vendors?.filter(v => v.status === "active").length ?? 0 },
            { label: "Inactive", value: vendors?.filter(v => v.status === "inactive").length ?? 0 },
            { label: "Avg Rating", value: vendors?.length ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1) : "—" },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No vendors found</TableCell></TableRow>
                ) : (
                  filtered?.map((v) => (
                    <TableRow key={v.id} className="cursor-pointer" onClick={() => setSelected(v)}>
                      <TableCell className="font-medium">{v.company_name}</TableCell>
                      <TableCell>{v.contact_name}</TableCell>
                      <TableCell className="text-sm">{v.email}</TableCell>
                      <TableCell>{v.phone}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {Array.isArray(v.categories) ? (v.categories as string[]).join(", ") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span>{v.rating ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.status === "active" ? "default" : "secondary"}>{v.status}</Badge>
                      </TableCell>
                      <TableCell>{v.payment_terms || "—"}</TableCell>
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
          <SheetHeader><SheetTitle>Vendor Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="space-y-4 mt-6">
              <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium">{selected.company_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Contact</p><p>{selected.contact_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p>{selected.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Phone</p><p>{selected.phone}</p></div>
              <div><p className="text-xs text-muted-foreground">Address</p><p>{selected.address || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Website</p><p>{selected.website || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Payment Terms</p><p>{selected.payment_terms || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Tax ID</p><p>{selected.tax_id || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Categories</p><p>{Array.isArray(selected.categories) ? (selected.categories as string[]).join(", ") : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= (selected.rating || 0) ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              <div><p className="text-xs text-muted-foreground">Notes</p><p className="text-sm">{selected.notes || "—"}</p></div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant={selected.status === "active" ? "outline" : "default"}
                  onClick={() => { updateStatus.mutate({ id: selected.id, status: "active" }); setSelected({ ...selected, status: "active" }); }}>
                  Activate
                </Button>
                <Button size="sm" variant={selected.status === "inactive" ? "outline" : "destructive"}
                  onClick={() => { updateStatus.mutate({ id: selected.id, status: "inactive" }); setSelected({ ...selected, status: "inactive" }); }}>
                  Deactivate
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

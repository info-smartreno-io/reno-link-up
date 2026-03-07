import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminDesignProfessionals() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: professionals, isLoading } = useQuery({
    queryKey: ["admin-design-professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_professional_profiles")
        .select("*, profiles:user_id(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("design_professional_profiles")
        .update({
          application_status: status,
          ...(status === "approved" ? { approved_at: new Date().toISOString() } : {}),
        })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-design-professionals"] });
      toast.success("Status updated");
    },
  });

  const filtered = professionals?.filter((p: any) => {
    const name = p.profiles?.full_name?.toLowerCase() || "";
    const company = p.company_name?.toLowerCase() || "";
    const matchesSearch = !search || name.includes(search.toLowerCase()) || company.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.application_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design Professionals</h1>
          <p className="text-muted-foreground">Manage architects, interior designers, and other design professionals</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: professionals?.length ?? 0 },
            { label: "Pending", value: professionals?.filter((p: any) => p.application_status === "pending").length ?? 0 },
            { label: "Approved", value: professionals?.filter((p: any) => p.application_status === "approved").length ?? 0 },
            { label: "Featured", value: professionals?.filter((p: any) => p.featured).length ?? 0 },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profile %</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No design professionals found</TableCell></TableRow>
                ) : (
                  filtered?.map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <TableCell className="font-medium">{p.profiles?.full_name || "—"}</TableCell>
                      <TableCell>{p.company_name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(p.specialties || []).slice(0, 2).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                          {(p.specialties?.length || 0) > 2 && <Badge variant="secondary" className="text-xs">+{p.specialties.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.application_status === "approved" ? "default" : p.application_status === "rejected" ? "destructive" : "secondary"}>
                          {p.application_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.profile_completion_percent || 0}%</TableCell>
                      <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
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
          <SheetHeader><SheetTitle>Design Professional Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="space-y-4 mt-6">
              <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{selected.profiles?.full_name || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Company</p><p>{selected.company_name || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p>{selected.profiles?.email || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Headline</p><p>{selected.headline || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Specialties</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selected.specialties || []).map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              </div>
              <div><p className="text-xs text-muted-foreground">Services</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selected.services_offered || []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                </div>
              </div>
              <div><p className="text-xs text-muted-foreground">Service Mode</p><p>{selected.service_mode || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Years in Business</p><p>{selected.years_in_business || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Profile Completion</p><p>{selected.profile_completion_percent || 0}%</p></div>
              <div><p className="text-xs text-muted-foreground">Application Status</p>
                <Badge variant={selected.application_status === "approved" ? "default" : "secondary"}>
                  {selected.application_status}
                </Badge>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" onClick={() => { updateStatus.mutate({ userId: selected.user_id, status: "approved" }); setSelected(null); }}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { updateStatus.mutate({ userId: selected.user_id, status: "rejected" }); setSelected(null); }}>
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => { updateStatus.mutate({ userId: selected.user_id, status: "revision_requested" }); setSelected(null); }}>
                  <Clock className="mr-1 h-4 w-4" /> Request Revision
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

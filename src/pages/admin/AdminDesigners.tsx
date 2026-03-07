import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Palette, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminDesigners() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-architect-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("architect_projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: proposals } = useQuery({
    queryKey: ["admin-architect-proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("architect_proposals")
        .select("*, architect_projects(project_name, client_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filtered = projects?.filter((p) =>
    !search || p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.architect_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Designers & Architects</h1>
          <p className="text-muted-foreground">Monitor creative and pre-construction collaborators</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Projects", value: projects?.length ?? 0 },
            { label: "Active", value: projects?.filter(p => p.status === "active" || p.status === "in_progress").length ?? 0 },
            { label: "Proposals", value: proposals?.length ?? 0 },
            { label: "Pending Review", value: proposals?.filter(p => p.status === "submitted" || p.status === "pending").length ?? 0 },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sq Ft</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No designer/architect projects found</TableCell></TableRow>
                ) : (
                  filtered?.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <TableCell className="font-medium">{p.project_name}</TableCell>
                      <TableCell>{p.client_name}</TableCell>
                      <TableCell>{p.project_type}</TableCell>
                      <TableCell>{p.location}</TableCell>
                      <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                      <TableCell>{p.square_footage ? p.square_footage.toLocaleString() : "—"}</TableCell>
                      <TableCell>{p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : "—"}</TableCell>
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
          <SheetHeader><SheetTitle>Project Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="space-y-4 mt-6">
              <div><p className="text-xs text-muted-foreground">Project</p><p className="font-medium">{selected.project_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Client</p><p>{selected.client_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Type</p><p>{selected.project_type}</p></div>
              <div><p className="text-xs text-muted-foreground">Location</p><p>{selected.location}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline">{selected.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Square Footage</p><p>{selected.square_footage?.toLocaleString() || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Estimated Value</p><p>{selected.estimated_value ? `$${selected.estimated_value.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{selected.description || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Deadline</p><p>{selected.deadline ? format(new Date(selected.deadline), "PPP") : "—"}</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

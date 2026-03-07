import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Package } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["all", "draft", "ready", "rfp_out", "bidding_closed", "awarded", "archived"];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    ready: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    rfp_out: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    bidding_closed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    awarded: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    archived: "bg-muted text-muted-foreground",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

export default function AdminBidPackets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: packets, isLoading } = useQuery({
    queryKey: ["admin-bid-packets-list", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bid_packets")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = (packets || []).filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" /> Bid Packets
          </h1>
          <p className="text-muted-foreground">Manage bid packets and RFP distribution</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search packets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Design Pkg</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bid packets found</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/bid-packets/${p.id}`)}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell><Badge className={statusBadge(p.status)}>{p.status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{p.bid_deadline ? format(new Date(p.bid_deadline), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>{p.generated_from_design_package ? "✅" : "—"}</TableCell>
                    <TableCell>{format(new Date(p.created_at), "MMM d")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function AdminVendorQuotes() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["admin-vendor-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = quotes?.filter(q => statusFilter === "all" || q.status === statusFilter) || [];
  const pendingCount = quotes?.filter(q => q.status === "pending" || q.status === "sent").length || 0;
  const receivedCount = quotes?.filter(q => q.status === "received").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendor Quote Requests</h1>
        <p className="text-sm text-muted-foreground">Track material pricing requests across all projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Requests</p>
              <p className="text-lg font-bold">{quotes?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Awaiting Response</p>
              <p className="text-lg font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Quotes Received</p>
              <p className="text-lg font-bold">{receivedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Vendor Requests</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Type</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{q.vendor_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[250px]">
                    {Array.isArray(q.materials) ? q.materials.map((m: any) => m.name || m).join(", ") : JSON.stringify(q.materials).slice(0, 60)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.status === "received" ? "default" : q.status === "accepted" ? "default" : "secondary"} className="text-xs">
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {q.created_at ? new Date(q.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{q.notes || "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No vendor quotes yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

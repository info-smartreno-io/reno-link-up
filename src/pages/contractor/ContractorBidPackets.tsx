import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Eye, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ContractorBidPackets() {
  const navigate = useNavigate();

  const { data: invites, isLoading } = useQuery({
    queryKey: ["contractor-bid-packet-invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("bid_packet_contractor_invites")
        .select("*, bid_packets(*)")
        .eq("contractor_id", user.id)
        .order("invited_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6" /> RFP Bid Packets
        </h1>
        <p className="text-muted-foreground">Review project scopes and submit your bids</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : !invites?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No RFP invitations yet</TableCell></TableRow>
              ) : invites.map((inv: any) => {
                const packet = inv.bid_packets;
                const deadlinePassed = isDeadlinePassed(packet?.bid_deadline);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{packet?.title || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "submitted" ? "default" : "outline"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={deadlinePassed ? "text-destructive" : ""}>
                          {packet?.bid_deadline ? format(new Date(packet.bid_deadline), "MMM d, yyyy") : "No deadline"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{inv.invited_at ? format(new Date(inv.invited_at), "MMM d") : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/contractor/bid-packets/${inv.bid_packet_id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

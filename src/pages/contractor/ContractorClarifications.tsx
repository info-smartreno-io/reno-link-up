import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function ContractorClarifications() {
  const navigate = useNavigate();

  const { data: packets = [], isLoading } = useQuery({
    queryKey: ["contractor-clarification-packets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all invites for this contractor
      const { data: invites, error } = await (supabase as any)
        .from("bid_packet_contractor_invites")
        .select("bid_packet_id, bid_packets(id, title, status)")
        .eq("contractor_id", user.id);
      if (error) throw error;

      // Get clarification counts per packet
      const packetIds = (invites || []).map((i: any) => i.bid_packet_id);
      if (packetIds.length === 0) return [];

      const { data: clarifications } = await (supabase as any)
        .from("bid_packet_clarifications")
        .select("id, bid_packet_id, message, sender_role, read_by_contractor, created_at")
        .in("bid_packet_id", packetIds)
        .order("created_at", { ascending: false });

      // Group by packet
      const byPacket: Record<string, any[]> = {};
      (clarifications || []).forEach((c: any) => {
        if (!byPacket[c.bid_packet_id]) byPacket[c.bid_packet_id] = [];
        byPacket[c.bid_packet_id].push(c);
      });

      return (invites || [])
        .filter((i: any) => byPacket[i.bid_packet_id]?.length > 0)
        .map((i: any) => {
          const msgs = byPacket[i.bid_packet_id] || [];
          const unread = msgs.filter((m: any) => m.sender_role !== "contractor" && !m.read_by_contractor).length;
          return {
            packetId: i.bid_packet_id,
            title: i.bid_packets?.title || "Untitled Packet",
            totalMessages: msgs.length,
            unreadCount: unread,
            lastMessage: msgs[0],
          };
        })
        .sort((a: any, b: any) => b.unreadCount - a.unreadCount || new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime());
    },
  });

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" /> Clarifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Questions and responses across your bid packets</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : packets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No clarification threads yet</p>
              <p className="text-xs mt-1">When you ask questions on a bid packet, they'll appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {packets.map((p: any) => (
              <Card
                key={p.packetId}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/contractor/bid-packets/${p.packetId}?tab=clarifications`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
                        {p.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {p.unreadCount} unread
                          </Badge>
                        )}
                      </div>
                      {p.lastMessage && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          <span className="font-medium">{p.lastMessage.sender_role === "contractor" ? "You" : p.lastMessage.sender_role}:</span>{" "}
                          {p.lastMessage.message}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{p.totalMessages} message{p.totalMessages !== 1 ? "s" : ""}</span>
                        {p.lastMessage && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(p.lastMessage.created_at), "MMM d, h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ContractorLayout>
  );
}

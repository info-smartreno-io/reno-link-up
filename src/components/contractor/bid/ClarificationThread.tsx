import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { logBidPacketActivity } from "@/utils/bidPacketAudit";

interface ClarificationThreadProps {
  packetId: string;
  currentUserId: string;
}

export function ClarificationThread({ packetId, currentUserId }: ClarificationThreadProps) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["bid-clarifications", packetId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bid_packet_clarifications")
        .select("*")
        .eq("bid_packet_id", packetId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Mark admin/estimator messages as read by contractor on load
  useEffect(() => {
    const unread = messages.filter((m: any) => m.sender_role !== "contractor" && !m.read_by_contractor);
    if (unread.length > 0) {
      const ids = unread.map((m: any) => m.id);
      (supabase as any)
        .from("bid_packet_clarifications")
        .update({ read_by_contractor: true })
        .in("id", ids)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["contractor-clarification-unreads"] });
          queryClient.invalidateQueries({ queryKey: ["bid-clarification-count", packetId] });
        });
    }
  }, [messages, packetId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim()) return;
      await (supabase as any)
        .from("bid_packet_clarifications")
        .insert({
          bid_packet_id: packetId,
          sender_id: currentUserId,
          sender_role: "contractor",
          message: newMessage.trim(),
          read_by_contractor: true,
        });
      await logBidPacketActivity({
        bidPacketId: packetId,
        actorId: currentUserId,
        actorRole: "contractor",
        actionType: "contractor_sent_clarification",
        actionDetails: { message_preview: newMessage.trim().substring(0, 100) },
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["bid-clarifications", packetId] });
    },
  });

  const hasUnread = messages.some(
    (m: any) => m.sender_role !== "contractor" && !m.read_by_contractor
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-primary" />
          Clarifications
          {hasUnread && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">New</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No clarification questions yet. Ask a question about the bid packet scope, materials, or requirements.
          </p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {messages.map((msg: any) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-80">
                        {isOwn ? "You" : msg.sender_role === "admin" ? "Admin" : "Estimator"}
                      </span>
                      {!isOwn && !msg.is_read && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">New</Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-line">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Compose */}
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask a question about this bid packet..."
            rows={2}
            className="flex-1 min-h-[60px]"
          />
          <Button
            size="icon"
            className="h-[60px] w-10 shrink-0"
            disabled={!newMessage.trim() || sendMessage.isPending}
            onClick={() => sendMessage.mutate()}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { logBidPacketActivity } from "@/utils/bidPacketAudit";

interface AdminClarificationPanelProps {
  packetId: string;
}

export function AdminClarificationPanel({ packetId }: AdminClarificationPanelProps) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-bid-clarifications", packetId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bid_packet_clarifications")
        .select("*, profiles:sender_id(full_name)")
        .eq("bid_packet_id", packetId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Mark contractor messages as read by admin
  const markRead = useMutation({
    mutationFn: async () => {
      const unread = messages.filter((m: any) => m.sender_role === "contractor" && !m.read_by_admin);
      if (unread.length === 0) return;
      const ids = unread.map((m: any) => m.id);
      await (supabase as any)
        .from("bid_packet_clarifications")
        .update({ read_by_admin: true })
        .in("id", ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bid-clarifications", packetId] });
    },
  });

  // Auto-mark contractor messages as read when panel loads
  const unreadCount = messages.filter((m: any) => m.sender_role === "contractor" && !m.read_by_admin).length;
  
  useEffect(() => {
    if (unreadCount > 0 && !markRead.isPending) {
      markRead.mutate();
    }
  }, [unreadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!reply.trim()) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await (supabase as any).from("bid_packet_clarifications").insert({
        bid_packet_id: packetId,
        sender_id: user.id,
        sender_role: "admin",
        message: reply.trim(),
        read_by_admin: true,
      });

      await logBidPacketActivity({
        bidPacketId: packetId,
        actorId: user.id,
        actorRole: "admin",
        actionType: "admin_clarification_reply",
        actionDetails: { message_preview: reply.trim().substring(0, 100) },
      });
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-bid-clarifications", packetId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Clarification Thread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{unreadCount} unread</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markRead.mutate()} className="text-xs">
              <CheckCheck className="mr-1 h-3 w-3" /> Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No clarification messages yet.</p>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {messages.map((msg: any) => {
              const isAdmin = msg.sender_role === "admin" || msg.sender_role === "estimator";
              return (
                <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-80">
                        {msg.profiles?.full_name || msg.sender_role}
                      </span>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${isAdmin ? "border-primary-foreground/30 text-primary-foreground/70" : ""}`}>
                        {msg.sender_role}
                      </Badge>
                      {!isAdmin && !msg.read_by_admin && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0">New</Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-line">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply */}
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to contractor clarification..."
            rows={2}
            className="flex-1 min-h-[60px]"
          />
          <Button
            size="icon"
            className="h-[60px] w-10 shrink-0"
            disabled={!reply.trim() || sendReply.isPending}
            onClick={() => sendReply.mutate()}
          >
            {sendReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

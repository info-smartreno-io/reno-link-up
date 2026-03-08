import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Eye, Send, Save, MessageSquare, RotateCcw, Upload,
  AlertTriangle, Trophy, Clock, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

const ACTION_CONFIG: Record<string, { label: string; icon: typeof Eye; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  contractor_viewed_packet: { label: "Viewed Packet", icon: Eye, variant: "outline" },
  contractor_saved_draft: { label: "Saved Draft", icon: Save, variant: "outline" },
  contractor_submitted_bid: { label: "Submitted Bid", icon: Send, variant: "default" },
  contractor_resubmitted_bid: { label: "Resubmitted Bid", icon: RotateCcw, variant: "default" },
  admin_requested_revision: { label: "Revision Requested", icon: AlertTriangle, variant: "destructive" },
  contractor_sent_clarification: { label: "Clarification Sent", icon: MessageSquare, variant: "secondary" },
  admin_clarification_reply: { label: "Admin Replied", icon: MessageSquare, variant: "secondary" },
  contractor_uploaded_attachment: { label: "File Uploaded", icon: Upload, variant: "outline" },
  contractor_awarded: { label: "Awarded", icon: Trophy, variant: "default" },
  packet_status_rfp_out: { label: "RFP Sent", icon: Send, variant: "default" },
  packet_status_bidding_closed: { label: "Bidding Closed", icon: Clock, variant: "outline" },
  contractor_invited: { label: "Contractors Invited", icon: Send, variant: "secondary" },
};

interface BidAuditTimelinePanelProps {
  packetId: string;
}

export function BidAuditTimelinePanel({ packetId }: BidAuditTimelinePanelProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["bid-packet-activity-log", packetId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bid_packet_activity_log")
        .select("*, profiles:actor_id(full_name)")
        .eq("bid_packet_id", packetId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: submissionHistory = [] } = useQuery({
    queryKey: ["bid-packet-submission-history", packetId],
    queryFn: async () => {
      const { data: submissions } = await supabase
        .from("bid_submissions")
        .select("id")
        .eq("bid_opportunity_id", packetId);
      if (!submissions?.length) return [];
      const ids = submissions.map(s => s.id);
      const { data } = await (supabase as any)
        .from("bid_submission_history")
        .select("*")
        .in("bid_submission_id", ids)
        .order("snapshot_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Audit Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : activities.length === 0 && submissionHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet.</p>
        ) : (
          <>
            {/* Activity events */}
            {activities.map((act: any) => {
              const config = ACTION_CONFIG[act.action_type] || {
                label: act.action_type.replace(/_/g, " "),
                icon: Clock,
                variant: "outline" as const,
              };
              const Icon = config.icon;
              const details = act.action_details || {};

              return (
                <Collapsible key={act.id}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 text-left w-full">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {act.profiles?.full_name || "System"}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0">{act.actor_role}</Badge>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(act.created_at), "MMM d, h:mm a")}
                      </span>
                      {Object.keys(details).length > 0 && (
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  {Object.keys(details).length > 0 && (
                    <CollapsibleContent>
                      <div className="ml-8 p-2 text-xs space-y-1 border-l-2 border-muted">
                        {Object.entries(details).map(([key, val]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-muted-foreground font-medium">{key.replace(/_/g, " ")}:</span>
                            <span className="text-foreground">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              );
            })}

            {/* Submission version history */}
            {submissionHistory.length > 0 && (
              <div className="pt-3 mt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Submission Versions</p>
                {submissionHistory.map((snap: any, i: number) => (
                  <Collapsible key={snap.id}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 text-left w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">v{submissionHistory.length - i}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{snap.status}</Badge>
                          {snap.bid_amount && (
                            <span className="text-xs font-mono">${Number(snap.bid_amount).toLocaleString()}</span>
                          )}
                          {snap.source_event && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{snap.source_event}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(snap.snapshot_at), "MMM d, h:mm a")}
                          </span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-4 p-3 text-sm space-y-2 border-l-2 border-muted">
                        {snap.estimated_timeline && (
                          <div><span className="text-xs text-muted-foreground">Timeline:</span> <span>{snap.estimated_timeline}</span></div>
                        )}
                        {snap.proposal_text && (
                          <div><span className="text-xs text-muted-foreground">Proposal:</span> <p className="line-clamp-3 text-xs">{snap.proposal_text}</p></div>
                        )}
                        {snap.revision_notes && (
                          <div><span className="text-xs text-muted-foreground">Revision Notes:</span> <p className="text-xs text-destructive">{snap.revision_notes}</p></div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

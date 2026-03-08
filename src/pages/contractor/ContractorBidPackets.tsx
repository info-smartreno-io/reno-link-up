import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Eye, Clock, AlertTriangle, Filter, RotateCcw } from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { computeContractorBidStatus, BID_STATUS_CONFIG, type ContractorBidDisplayStatus } from "@/utils/contractorBidStatus";

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-xs text-muted-foreground">No deadline</span>;
  const d = new Date(deadline);
  const now = new Date();
  const isPast = d < now;
  const hoursLeft = differenceInHours(d, now);
  const daysLeft = differenceInDays(d, now);

  if (isPast) {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <Clock className="h-3 w-3" /> Closed
      </Badge>
    );
  }
  if (hoursLeft < 48) {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-destructive text-destructive">
        <AlertTriangle className="h-3 w-3" /> {hoursLeft}h left
      </Badge>
    );
  }
  if (daysLeft <= 7) {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-border text-muted-foreground">
        <Clock className="h-3 w-3" /> {daysLeft}d left
      </Badge>
    );
  }
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Clock className="h-3 w-3" /> {format(d, "MMM d, yyyy")}
    </span>
  );
}

export default function ContractorBidPackets() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["contractor-bid-packet-invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("bid_packet_contractor_invites")
        .select("*, bid_packets(id, title, bid_deadline, bid_due_date, status, project_overview, scope_summary, estimated_budget_min, estimated_budget_max)")
        .eq("contractor_id", user.id)
        .order("invited_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["contractor-bid-submissions-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("bid_submissions")
        .select("id, bid_opportunity_id, status, bid_amount, submitted_at, revision_requested_at, revision_request_notes, revision_count");
      return data || [];
    },
  });

  // Unread clarification counts
  const { data: unreadClarifications = {} } = useQuery({
    queryKey: ["contractor-clarification-unreads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};
      const { data } = await (supabase as any)
        .from("bid_packet_clarifications")
        .select("bid_packet_id")
        .eq("read_by_contractor", false)
        .neq("sender_role", "contractor");
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.bid_packet_id] = (counts[r.bid_packet_id] || 0) + 1;
      });
      return counts;
    },
  });

  const submissionMap = new Map(submissions.map((s: any) => [s.bid_opportunity_id, s]));

  // Compute display status per invite
  const enriched = invites.map((inv: any) => {
    const packet = inv.bid_packets;
    const submission = submissionMap.get(inv.bid_packet_id);
    const deadline = packet?.bid_deadline || packet?.bid_due_date;
    const deadlinePassed = deadline ? new Date(deadline) < new Date() : false;
    const displayStatus = computeContractorBidStatus({
      inviteStatus: inv.status,
      submissionStatus: submission?.status || null,
      submissionRevisionCount: submission?.revision_count || 0,
      deadlinePassed,
    });
    return { ...inv, packet, submission, deadline, deadlinePassed, displayStatus };
  });

  const filtered = enriched.filter((item: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "action_needed") {
      return item.displayStatus === "new_invite" || item.displayStatus === "draft_in_progress" || item.displayStatus === "revision_requested";
    }
    return item.displayStatus === statusFilter;
  });

  const actionNeededCount = enriched.filter((item: any) =>
    item.displayStatus === "new_invite" || item.displayStatus === "draft_in_progress" || item.displayStatus === "revision_requested"
  ).length;

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" /> RFP Bid Packets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Review project scopes and submit your bids</p>
          </div>
          <div className="flex items-center gap-2">
            {actionNeededCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {actionNeededCount} need{actionNeededCount === 1 ? "s" : ""} action
              </Badge>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invitations</SelectItem>
                <SelectItem value="action_needed">Action Needed</SelectItem>
                <SelectItem value="new_invite">New Invites</SelectItem>
                <SelectItem value="draft_in_progress">Drafts</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
                <SelectItem value="resubmitted">Resubmitted</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading bid packets...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {statusFilter === "all"
                ? "No RFP invitations yet. You'll be notified when you're invited to bid on a project."
                : "No bid packets match this filter."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((item: any) => {
              const { packet, submission, deadline, deadlinePassed, displayStatus } = item;
              if (!packet) return null;
              const config = BID_STATUS_CONFIG[displayStatus as ContractorBidDisplayStatus];
              const unreadCount = (unreadClarifications as Record<string, number>)[item.bid_packet_id] || 0;

              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    displayStatus === "new_invite" ? "border-primary/30" : ""
                  } ${displayStatus === "revision_requested" ? "border-destructive/30" : ""} ${
                    deadlinePassed && displayStatus !== "submitted" && displayStatus !== "resubmitted" ? "opacity-70" : ""
                  }`}
                  onClick={() => navigate(`/contractor/bid-packets/${item.bid_packet_id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{packet.title || "Untitled Packet"}</h3>
                          <Badge variant={config.variant} className="text-xs gap-1">{config.label}</Badge>
                          <DeadlineBadge deadline={deadline} />
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              {unreadCount} new response{unreadCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          {item.invited_at && <span>Invited {format(new Date(item.invited_at), "MMM d, yyyy")}</span>}
                          {packet.estimated_budget_min && packet.estimated_budget_max && (
                            <span>Budget: ${(packet.estimated_budget_min / 1000).toFixed(0)}k–${(packet.estimated_budget_max / 1000).toFixed(0)}k</span>
                          )}
                          {submission?.bid_amount && (
                            <span className="font-medium text-foreground">Your bid: ${Number(submission.bid_amount).toLocaleString()}</span>
                          )}
                        </div>
                        {packet.project_overview && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{packet.project_overview}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={displayStatus === "new_invite" || displayStatus === "revision_requested" ? "default" : "outline"}
                          onClick={(e) => { e.stopPropagation(); navigate(`/contractor/bid-packets/${item.bid_packet_id}`); }}
                        >
                          {displayStatus === "new_invite" ? (
                            <><Eye className="mr-1 h-3.5 w-3.5" /> Review & Bid</>
                          ) : displayStatus === "revision_requested" ? (
                            <><RotateCcw className="mr-1 h-3.5 w-3.5" /> Revise Bid</>
                          ) : displayStatus === "submitted" || displayStatus === "resubmitted" ? (
                            <><Eye className="mr-1 h-3.5 w-3.5" /> View Submission</>
                          ) : (
                            <><Eye className="mr-1 h-3.5 w-3.5" /> Continue</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ContractorLayout>
  );
}

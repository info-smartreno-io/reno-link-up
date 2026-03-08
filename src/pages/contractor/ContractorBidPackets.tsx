import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Eye, Clock, CheckCircle2, AlertTriangle, Send, FileText, Filter } from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof CheckCircle2 }> = {
  invited: { label: "New Invite", variant: "secondary", icon: Package },
  viewed: { label: "Viewed", variant: "outline", icon: Eye },
  draft: { label: "Draft", variant: "outline", icon: FileText },
  submitted: { label: "Submitted", variant: "default", icon: Send },
  awarded: { label: "Awarded", variant: "default", icon: CheckCircle2 },
  declined: { label: "Declined", variant: "destructive", icon: AlertTriangle },
};

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
      <Badge variant="outline" className="text-xs gap-1 border-amber-400 text-amber-700 dark:text-amber-400">
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

  // Get submission statuses for each invite
  const { data: submissions = [] } = useQuery({
    queryKey: ["contractor-bid-submissions-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("bid_submissions")
        .select("id, bid_opportunity_id, status, bid_amount, submitted_at")
        .eq("bidder_id", user.id);
      return data || [];
    },
  });

  const submissionMap = new Map(submissions.map((s: any) => [s.bid_opportunity_id, s]));

  const filtered = invites.filter((inv: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "action_needed") {
      const sub = submissionMap.get(inv.bid_packet_id);
      const deadline = inv.bid_packets?.bid_deadline;
      const isPast = deadline ? new Date(deadline) < new Date() : false;
      return !isPast && (!sub || sub.status === "draft") && inv.status !== "submitted";
    }
    return inv.status === statusFilter;
  });

  const actionNeededCount = invites.filter((inv: any) => {
    const sub = submissionMap.get(inv.bid_packet_id);
    const deadline = inv.bid_packets?.bid_deadline;
    const isPast = deadline ? new Date(deadline) < new Date() : false;
    return !isPast && (!sub || sub.status === "draft") && inv.status !== "submitted";
  }).length;

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" /> RFP Bid Packets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review project scopes and submit your bids
            </p>
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
                <SelectItem value="invited">New Invites</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Packet Cards */}
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
            {filtered.map((inv: any) => {
              const packet = inv.bid_packets;
              if (!packet) return null;
              const submission = submissionMap.get(inv.bid_packet_id);
              const deadline = packet.bid_deadline || packet.bid_due_date;
              const isPast = deadline ? new Date(deadline) < new Date() : false;
              const effectiveStatus = inv.status === "submitted" || submission?.status === "submitted" ? "submitted" : inv.status;
              const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.invited;
              const StatusIcon = config.icon;

              return (
                <Card
                  key={inv.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    effectiveStatus === "invited" ? "border-primary/30" : ""
                  } ${isPast && effectiveStatus !== "submitted" ? "opacity-70" : ""}`}
                  onClick={() => navigate(`/contractor/bid-packets/${inv.bid_packet_id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{packet.title || "Untitled Packet"}</h3>
                          <Badge variant={config.variant} className="text-xs gap-1">
                            <StatusIcon className="h-3 w-3" /> {config.label}
                          </Badge>
                          <DeadlineBadge deadline={deadline} />
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          {inv.invited_at && (
                            <span>Invited {format(new Date(inv.invited_at), "MMM d, yyyy")}</span>
                          )}
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
                          variant={effectiveStatus === "invited" ? "default" : "outline"}
                          onClick={(e) => { e.stopPropagation(); navigate(`/contractor/bid-packets/${inv.bid_packet_id}`); }}
                        >
                          {effectiveStatus === "invited" ? (
                            <><Eye className="mr-1 h-3.5 w-3.5" /> Review & Bid</>
                          ) : effectiveStatus === "submitted" ? (
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

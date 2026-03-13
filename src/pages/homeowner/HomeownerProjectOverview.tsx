import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHomeownerProjectDetail,
  useHomeownerBidPacket,
  getHomeownerStatus,
  getNextStep,
  HOMEOWNER_MILESTONES,
} from "@/hooks/useHomeownerData";
import {
  CheckCircle2,
  Circle,
  User,
  Phone,
  Mail,
  CalendarDays,
  Wrench,
  ArrowRight,
  Users,
  FileText,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const ACTIVITY_ICONS: Record<string, typeof Wrench> = {
  status_change: ArrowRight,
  daily_log: Wrench,
  contractor_selected: Users,
  file_upload: FileText,
  message: MessageSquare,
};

export default function HomeownerProjectOverview() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useHomeownerProjectDetail(projectId);
  const { data: bidPacketData, isLoading: bidLoading } = useHomeownerBidPacket(projectId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { project, contractor, recentLogs, timelineTasks, recentActivity } = data!;
  const status = getHomeownerStatus(project.status || "intake");
  const nextStep = getNextStep(project.status || "intake");
  const progressPercent = Math.round((status.step / (HOMEOWNER_MILESTONES.length - 1)) * 100);

  const completedTasks = timelineTasks.filter((t: any) => t.status === "completed").length;
  const totalTasks = timelineTasks.length;

  return (
    <div className="space-y-6">
      {/* Bid Packet Summary: scope, line items, inclusions/exclusions */}
      {bidLoading ? (
        <Card>
          <CardContent className="p-5">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : bidPacketData?.packet ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Bid packet scope of work
              </span>
              <button
                type="button"
                onClick={() => navigate(`/homeowner/projects/${project.id}/files`)}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                View photos & files
                <ArrowRight className="h-3 w-3" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Project</p>
                <p className="font-medium text-foreground">{bidPacketData.packet.title || project.client_name}</p>
              </div>
              {bidPacketData.packet.bid_due_date && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Bid finalized</p>
                  <p className="text-foreground">
                    {format(new Date(bidPacketData.packet.bid_due_date), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {project.address && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Project address</p>
                  <p className="text-foreground">{project.address}</p>
                </div>
              )}
              {bidPacketData.packet.estimated_budget_min && bidPacketData.packet.estimated_budget_max && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Target budget range</p>
                  <p className="text-foreground">
                    ${(bidPacketData.packet.estimated_budget_min / 1000).toFixed(0)}k – $
                    {(bidPacketData.packet.estimated_budget_max / 1000).toFixed(0)}k
                  </p>
                </div>
              )}
            </div>

            {bidPacketData.packet.scope_summary && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Scope summary</p>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {bidPacketData.packet.scope_summary}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {bidPacketData.packet.inclusions && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Inclusions</p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {bidPacketData.packet.inclusions}
                  </p>
                </div>
              )}
              {bidPacketData.packet.exclusions && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Exclusions</p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {bidPacketData.packet.exclusions}
                  </p>
                </div>
              )}
              {bidPacketData.packet.design_selections_notes && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Materials & selections</p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {bidPacketData.packet.design_selections_notes}
                  </p>
                </div>
              )}
            </div>

            {bidPacketData.tradeSections.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Scope by trade & measurements
                </p>
                <div className="space-y-3">
                  {bidPacketData.tradeSections.map((section: any) => (
                    <div key={section.id} className="border border-border rounded-md p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{section.trade}</p>
                        {section.allowance_amount && (
                          <span className="text-xs text-muted-foreground">
                            Allowance: ${Number(section.allowance_amount).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {section.scope_notes && (
                        <p className="text-xs text-muted-foreground whitespace-pre-line">
                          {section.scope_notes}
                        </p>
                      )}
                      {section.bid_packet_line_items?.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {section.bid_packet_line_items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1"
                            >
                              <span className="text-foreground">{item.description}</span>
                              <span className="text-muted-foreground">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              This view summarizes the scope and measurements your bids are based on. For full
              documents, photos, and videos, use the Files tab.
            </p>
          </CardContent>
        </Card>
      ) : null}
      {/* What Happens Next - signature trust card */}
      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">What Happens Next</p>
          <p className="text-sm text-foreground leading-relaxed">{nextStep}</p>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-foreground">Project Progress</h3>
            <span className="text-xs text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between">
            {HOMEOWNER_MILESTONES.map((m, i) => (
              <div key={m} className="flex flex-col items-center" style={{ width: `${100 / HOMEOWNER_MILESTONES.length}%` }}>
                {i <= status.step ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                )}
                <span className="text-[9px] text-muted-foreground mt-1 text-center leading-tight hidden lg:block">
                  {m}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Timeline Snapshot */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Timeline Snapshot
            </h3>
            {totalTasks > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} milestones completed</p>
                <div className="space-y-2">
                  {timelineTasks.slice(0, 4).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className="text-foreground truncate">{task.task_name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Timeline will appear once construction begins.</p>
            )}
          </CardContent>
        </Card>

        {/* Key Contacts */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Key Contacts
            </h3>
            {contractor ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Your Contractor</p>
                <p className="text-sm font-medium text-foreground">{contractor.company_name}</p>
                {contractor.contact_name && (
                  <p className="text-xs text-muted-foreground">{contractor.contact_name}</p>
                )}
                {contractor.contact_phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {contractor.contact_phone}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Contractor will be assigned after selection.</p>
            )}
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">SmartReno Support</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Mail className="h-3 w-3" /> support@smartreno.com
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity from activity log */}
      {recentActivity && recentActivity.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity: any) => {
                const Icon = ACTIVITY_ICONS[activity.activity_type] || ArrowRight;
                return (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Daily Logs */}
      {recentLogs.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Recent Progress Updates
            </h3>
            <div className="space-y-3">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                    {new Date(log.log_date).toLocaleDateString()}
                  </div>
                  <div>
                    <p className="text-foreground">{log.work_completed}</p>
                    {log.crew_summary && (
                      <p className="text-xs text-muted-foreground mt-0.5">{log.crew_summary}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

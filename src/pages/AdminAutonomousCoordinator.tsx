import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoordinatorDashboard } from "@/components/admin/CoordinatorDashboard";
import { TimelineAdjustmentPanel } from "@/components/admin/TimelineAdjustmentPanel";
import { HomeownerUpdateCenter } from "@/components/admin/HomeownerUpdateCenter";
import { SubCoordinatorPanel } from "@/components/admin/SubCoordinatorPanel";
import { EscalationCenter } from "@/components/admin/EscalationCenter";
import { TaskQueuePanel } from "@/components/admin/TaskQueuePanel";
import { CheckCircle2, Calendar, Mail, Users, AlertCircle, ListTodo } from "lucide-react";

export default function AdminAutonomousCoordinator() {
  // Sample data for demo purposes
  const sampleProjectId = "sample-project-id";
  const sampleTimeline = [
    { phase: "Demolition", status: "completed", date: "2025-01-15" },
    { phase: "Framing", status: "in_progress", date: "2025-01-20" },
    { phase: "Electrical", status: "pending", date: "2025-01-25" }
  ];
  const sampleMessages = [
    { from: "contractor", content: "Material delayed by 2 days", timestamp: "2025-01-18", read: true },
    { from: "homeowner", content: "When will tile be installed?", timestamp: "2025-01-19", read: false }
  ];
  const sampleContractorUpdates = [
    { update: "Framing 80% complete", date: "2025-01-19" }
  ];
  const sampleSubSchedules = [
    { trade: "Plumbing", scheduled: "2025-01-22", status: "confirmed" },
    { trade: "HVAC", scheduled: "2025-01-24", status: "pending" }
  ];
  const sampleMaterialStatus = [
    { material: "Tile", status: "delayed", eta: "2025-01-21" },
    { material: "Windows", status: "on_track", eta: "2025-01-23" }
  ];
  const sampleRecentPhotos = [
    { url: "/photo1.jpg", date: "2025-01-18" },
    { url: "/photo2.jpg", date: "2025-01-19" }
  ];
  const sampleLast24hActivity = [
    { activity: "Photos uploaded", timestamp: "2025-01-19T10:00:00Z" },
    { activity: "Message from contractor", timestamp: "2025-01-19T14:00:00Z" }
  ];
  const sampleMaterialDelays = [
    { material: "Porcelain Tile", delay_days: 2, reason: "Shipping delay" }
  ];
  const sampleSubReschedules = [
    { trade: "Plumbing", original: "2025-01-20", new: "2025-01-22" }
  ];
  const sampleInspectionUpdates = [
    { type: "Electrical", scheduled: "2025-01-26", status: "scheduled" }
  ];
  const sampleRecentChanges = [
    { change: "Tile delivery delayed", impact: "medium" }
  ];
  const sampleMilestones = [
    { milestone: "Framing Complete", date: "2025-01-20", status: "on_track" }
  ];
  const sampleDelays = [
    { item: "Tile", days: 2 }
  ];
  const sampleRecentEvents = [
    { event: "Material delay reported", date: "2025-01-18" }
  ];
  const sampleRiskFactors = [
    { factor: "Weather delays possible", severity: "medium" }
  ];
  const sampleMaterials = [
    { name: "Tile", quantity: 500, status: "delayed" }
  ];
  const samplePendingItems = [
    { item: "HVAC sub confirmation", priority: "high" }
  ];

  return (
    <AdminLayout role="admin">
      <div className="space-y-6">
        <Breadcrumbs />

        <div>
          <h1 className="text-3xl font-bold mb-2">AI Autonomous Coordinator Mode</h1>
          <p className="text-muted-foreground">
            Phase 10: Virtual project coordinator - automated monitoring, communication, and task management
          </p>
        </div>

        <Tabs defaultValue="coordinator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="coordinator" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Coordinator
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-2">
              <Mail className="h-4 w-4" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="subs" className="gap-2">
              <Users className="h-4 w-4" />
              Subs
            </TabsTrigger>
            <TabsTrigger value="escalation" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Escalation
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coordinator">
            <CoordinatorDashboard
              projectId={sampleProjectId}
              timeline={sampleTimeline}
              messages={sampleMessages}
              contractorUpdates={sampleContractorUpdates}
              subSchedules={sampleSubSchedules}
              materialStatus={sampleMaterialStatus}
              recentPhotos={sampleRecentPhotos}
              last24hActivity={sampleLast24hActivity}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineAdjustmentPanel
              projectId={sampleProjectId}
              currentTimeline={sampleTimeline}
              materialDelays={sampleMaterialDelays}
              subReschedules={sampleSubReschedules}
              inspectionUpdates={sampleInspectionUpdates}
            />
          </TabsContent>

          <TabsContent value="updates">
            <HomeownerUpdateCenter
              projectId={sampleProjectId}
              timeline={sampleTimeline}
              recentChanges={sampleRecentChanges}
              milestones={sampleMilestones}
              delays={sampleDelays}
            />
          </TabsContent>

          <TabsContent value="subs">
            <SubCoordinatorPanel
              projectId={sampleProjectId}
              subSchedules={sampleSubSchedules}
              timeline={sampleTimeline}
              trade="Plumbing"
              delayContext={{ reason: "Material delay", impact: "medium" }}
            />
          </TabsContent>

          <TabsContent value="escalation">
            <EscalationCenter
              projectId={sampleProjectId}
              riskScore={65}
              contractorResponsiveness={{ avg_hours: 12, last_response: "2025-01-19" }}
              subResponsiveness={{ plumbing: "responsive", hvac: "slow" }}
              materialDelays={sampleMaterialDelays}
              inspections={sampleInspectionUpdates}
              messages={sampleMessages}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskQueuePanel
              projectId={sampleProjectId}
              timeline={sampleTimeline}
              recentEvents={sampleRecentEvents}
              riskFactors={sampleRiskFactors}
              materials={sampleMaterials}
              pendingItems={samplePendingItems}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

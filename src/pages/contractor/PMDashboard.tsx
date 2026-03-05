import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { PMSnapshot } from "@/components/pm/PMSnapshot";
import { PMActiveProjectsTable } from "@/components/pm/PMActiveProjectsTable";
import { PMUrgentActionsPanel } from "@/components/pm/PMUrgentActionsPanel";
import { PMQuickNavCards } from "@/components/pm/PMQuickNavCards";
import { PMRecentActivityFeed } from "@/components/pm/PMRecentActivityFeed";
import { PMUpcomingAppointments } from "@/components/pm/PMUpcomingAppointments";
import { PortalCopilot } from "@/components/ai/PortalCopilot";
import { HardHat } from "lucide-react";

export default function PMDashboard() {
  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HardHat className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Project Manager Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Track production execution, inspections, and change orders
            </p>
          </div>
        </div>

        {/* KPI Snapshot */}
        <PMSnapshot />

        {/* Urgent Actions + Quick Navigation Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PMUrgentActionsPanel />
          <PMQuickNavCards />
        </div>

        {/* Active Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <PMActiveProjectsTable />
          </CardContent>
        </Card>

        {/* Appointments + Activity Feed Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PMUpcomingAppointments />
          <PMRecentActivityFeed />
        </div>
      </div>

      {/* AI Copilot */}
      <PortalCopilot role="pm" />
    </ContractorLayout>
  );
}

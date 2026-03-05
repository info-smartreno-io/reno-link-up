import { OperationsRunConsole } from "@/components/admin/OperationsRunConsole";
import { CommunicationSchedulerPanel } from "@/components/admin/CommunicationSchedulerPanel";
import { InspectionCenter } from "@/components/admin/InspectionCenter";
import { AutoQAMonitor } from "@/components/admin/AutoQAMonitor";

export default function AdminAutonomousOps() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Autonomous Operations Mode</h1>
        <p className="text-muted-foreground">
          AI-driven operational automation across all SmartReno portals
        </p>
      </div>

      <div className="grid gap-6">
        <OperationsRunConsole />
        
        <div className="grid md:grid-cols-2 gap-6">
          <CommunicationSchedulerPanel />
          <InspectionCenter />
        </div>

        <AutoQAMonitor />
      </div>
    </div>
  );
}
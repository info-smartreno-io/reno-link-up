import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { PipelineLeadCard, PipelineLead } from "./PipelineLeadCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PipelineStage {
  id: string;
  label: string;
  color: string;
}

interface PipelineStageColumnProps {
  stage: PipelineStage;
  leads: PipelineLead[];
  onAssignEstimator: (leadId: string) => void;
  onScheduleWalkthrough: (leadId: string) => void;
  onViewDetails: (leadId: string) => void;
}

export function PipelineStageColumn({
  stage,
  leads,
  onAssignEstimator,
  onScheduleWalkthrough,
  onViewDetails,
}: PipelineStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg min-w-[280px] w-[280px] shrink-0 transition-colors",
        isOver && "bg-accent/50 ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Stage Header */}
      <div className="p-3 border-b bg-background rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <span className="font-medium text-sm">{stage.label}</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Leads List */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <div className="p-2 space-y-2">
          {leads.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No leads
            </div>
          ) : (
            leads.map((lead) => (
              <PipelineLeadCard
                key={lead.id}
                lead={lead}
                stageColor={stage.color}
                onAssignEstimator={onAssignEstimator}
                onScheduleWalkthrough={onScheduleWalkthrough}
                onViewDetails={onViewDetails}
                compact
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

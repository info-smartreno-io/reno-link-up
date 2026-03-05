import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from "@dnd-kit/core";
import { useState } from "react";
import { PipelineStageColumn } from "./PipelineStageColumn";
import { PipelineLeadCard, PipelineLead } from "./PipelineLeadCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const PIPELINE_STAGES = [
  { id: "new_lead", label: "New Lead", color: "hsl(217, 91%, 60%)" },
  { id: "call_24h", label: "24hr Call", color: "hsl(45, 93%, 47%)" },
  { id: "walkthrough", label: "Walkthrough", color: "hsl(262, 83%, 58%)" },
  { id: "scope_sent", label: "Scope Sent", color: "hsl(142, 76%, 36%)" },
  { id: "scope_adjustment", label: "Scope Adjust", color: "hsl(30, 80%, 55%)" },
  { id: "architectural_design", label: "Arch/Design", color: "hsl(280, 65%, 60%)" },
  { id: "bid_room", label: "Bid Room", color: "hsl(195, 75%, 45%)" },
  { id: "smart_bid_3", label: "3SmartBid", color: "hsl(340, 75%, 55%)" },
  { id: "financing", label: "Financing", color: "hsl(160, 70%, 50%)" },
  { id: "bid_accepted", label: "Bid Accepted", color: "hsl(120, 60%, 50%)" },
];

interface PipelineKanbanProps {
  leads: PipelineLead[];
  onDragEnd: (leadId: string, newStatus: string, currentStatus: string) => void;
  onAssignEstimator: (leadId: string) => void;
  onScheduleWalkthrough: (leadId: string) => void;
  onViewDetails: (leadId: string) => void;
}

export function PipelineKanban({
  leads,
  onDragEnd,
  onAssignEstimator,
  onScheduleWalkthrough,
  onViewDetails,
}: PipelineKanbanProps) {
  const [activeLead, setActiveLead] = useState<PipelineLead | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead;
    if (lead) {
      setActiveLead(lead);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    const currentStatus = active.data.current?.currentStatus;

    if (newStatus !== currentStatus) {
      onDragEnd(leadId, newStatus, currentStatus);
    }
  };

  const getLeadsForStage = (stageId: string) => {
    return leads.filter((lead) => lead.status === stageId);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => (
            <PipelineStageColumn
              key={stage.id}
              stage={stage}
              leads={getLeadsForStage(stage.id)}
              onAssignEstimator={onAssignEstimator}
              onScheduleWalkthrough={onScheduleWalkthrough}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeLead ? (
          <PipelineLeadCard
            lead={activeLead}
            stageColor={PIPELINE_STAGES.find((s) => s.id === activeLead.status)?.color || "hsl(0, 0%, 50%)"}
            onAssignEstimator={() => {}}
            onScheduleWalkthrough={() => {}}
            onViewDetails={() => {}}
            compact
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

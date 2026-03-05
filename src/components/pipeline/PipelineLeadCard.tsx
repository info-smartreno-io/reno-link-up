import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar, User, DollarSign, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";

export interface PipelineLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  project_type: string;
  status: string;
  estimated_budget: string | null;
  created_at: string;
  estimator_id: string | null;
  walkthrough_scheduled_at: string | null;
  walkthrough_completed_at: string | null;
  estimator_name?: string;
}

interface PipelineLeadCardProps {
  lead: PipelineLead;
  stageColor: string;
  onAssignEstimator: (leadId: string) => void;
  onScheduleWalkthrough: (leadId: string) => void;
  onViewDetails: (leadId: string) => void;
  compact?: boolean;
}

export function PipelineLeadCard({
  lead,
  stageColor,
  onAssignEstimator,
  onScheduleWalkthrough,
  onViewDetails,
  compact = false,
}: PipelineLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead, currentStatus: lead.status },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  const needsEstimator = !lead.estimator_id && lead.status !== "new_lead";
  const needsWalkthrough = lead.estimator_id && !lead.walkthrough_scheduled_at && 
    ["call_24h", "walkthrough"].includes(lead.status);

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, borderLeftColor: stageColor }}
        {...listeners}
        {...attributes}
        className={cn(
          "p-3 bg-card rounded-lg border-l-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{lead.name}</p>
            <p className="text-xs text-muted-foreground truncate">{lead.project_type}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(lead.id);
            }}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        
        {lead.estimated_budget && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>{lead.estimated_budget}</span>
          </div>
        )}

        <div className="flex gap-1 mt-2">
          {lead.estimator_name ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <User className="h-2.5 w-2.5 mr-1" />
              {lead.estimator_name.split(" ")[0]}
            </Badge>
          ) : needsEstimator ? (
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onAssignEstimator(lead.id);
              }}
            >
              Assign
            </Button>
          ) : null}
          
          {lead.walkthrough_scheduled_at ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <Calendar className="h-2.5 w-2.5 mr-1" />
              {format(new Date(lead.walkthrough_scheduled_at), "MMM d")}
            </Badge>
          ) : needsWalkthrough ? (
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onScheduleWalkthrough(lead.id);
              }}
            >
              Schedule
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: stageColor }}
      {...listeners}
      {...attributes}
      className={cn(
        "p-4 border-l-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{lead.name}</h3>
          <p className="text-sm text-muted-foreground">{lead.project_type}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(lead.id);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" />
          <span>{lead.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{lead.location}</span>
        </div>
        {lead.estimated_budget && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span>{lead.estimated_budget}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {lead.estimator_name ? (
          <Badge variant="secondary" className="gap-1">
            <User className="h-3 w-3" />
            {lead.estimator_name}
          </Badge>
        ) : needsEstimator ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onAssignEstimator(lead.id);
            }}
          >
            <User className="h-3 w-3 mr-1" />
            Assign Estimator
          </Button>
        ) : null}

        {lead.walkthrough_scheduled_at ? (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(lead.walkthrough_scheduled_at), "MMM d, h:mm a")}
          </Badge>
        ) : needsWalkthrough ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onScheduleWalkthrough(lead.id);
            }}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Schedule Visit
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

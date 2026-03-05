import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  project_type: string;
  status: string;
}

interface DraggableLeadCardProps {
  lead: Lead;
  stageColor: string;
}

export function DraggableLeadCard({ lead, stageColor }: DraggableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: {
      lead,
      currentStatus: lead.status,
    },
  });

  const combinedStyle = {
    transform: CSS.Translate.toString(transform),
    borderLeftColor: stageColor,
  };

  return (
    <Card
      ref={setNodeRef}
      style={combinedStyle}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02] border-l-4",
        isDragging && "opacity-50 shadow-xl scale-105 rotate-2"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{lead.name}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span className="truncate">{lead.phone}</span>
          </div>
          <Badge variant="secondary" className="mt-2 text-[10px]">
            {lead.project_type}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

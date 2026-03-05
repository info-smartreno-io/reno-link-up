import { formatDistanceToNow } from "date-fns";
import { ACTIVITY_CONFIG, ActivityType } from "@/hooks/useLeadActivities";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Phone,
  Mail,
  StickyNote,
  Calendar,
  ArrowRight,
  FileText,
  User,
  Users,
  MapPin,
  MoreHorizontal,
  Clock,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  Mail,
  StickyNote,
  Calendar,
  ArrowRight,
  FileText,
  User,
  Users,
  MapPin,
  MoreHorizontal,
};

interface LastActivityBadgeProps {
  activityType: string | null;
  activityAt: string | null;
  performerName?: string | null;
}

export function LastActivityBadge({
  activityType,
  activityAt,
  performerName,
}: LastActivityBadgeProps) {
  if (!activityType || !activityAt) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        No activity
      </span>
    );
  }

  const config = ACTIVITY_CONFIG[activityType as ActivityType] || ACTIVITY_CONFIG.other;
  const IconComponent = iconMap[config.icon] || MoreHorizontal;
  const timeAgo = formatDistanceToNow(new Date(activityAt), { addSuffix: true });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`p-1 rounded-full bg-accent ${config.color}`}>
              <IconComponent className="h-3 w-3" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{config.label}</span>
              <span className="text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label} {timeAgo}</p>
          {performerName && <p className="text-xs text-muted-foreground">by {performerName}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

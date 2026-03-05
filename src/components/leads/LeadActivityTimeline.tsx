import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useLeadActivities, ACTIVITY_CONFIG, ActivityType } from "@/hooks/useLeadActivities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ChevronDown,
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

interface LeadActivityTimelineProps {
  leadId: string;
  compact?: boolean;
  limit?: number;
}

export function LeadActivityTimeline({
  leadId,
  compact = false,
  limit = 5,
}: LeadActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const { data: activities, isLoading } = useLeadActivities(leadId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activities recorded yet
      </p>
    );
  }

  const displayedActivities = showAll ? activities : activities.slice(0, limit);
  const hasMore = activities.length > limit;

  if (compact) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-auto py-1 px-2">
            <Clock className="h-3 w-3" />
            {activities.length} activities
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-3">
      {displayedActivities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
      
      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Show {activities.length - limit} more
        </Button>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: { 
  id: string;
  activity_type: string;
  description: string | null;
  performer_name?: string;
  performed_at: string;
} }) {
  const config = ACTIVITY_CONFIG[activity.activity_type as ActivityType] || ACTIVITY_CONFIG.other;
  const IconComponent = iconMap[config.icon] || MoreHorizontal;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
      <div className={`p-1.5 rounded-full bg-accent ${config.color}`}>
        <IconComponent className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">{config.label}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.performed_at), { addSuffix: true })}
          </span>
        </div>
        {activity.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {activity.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          by {activity.performer_name || "Unknown"} • {format(new Date(activity.performed_at), "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}

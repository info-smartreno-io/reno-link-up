import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function Deadline({ dueAt }: { dueAt?: string | null }) {
  if (!dueAt) return <span className="text-muted-foreground">—</span>;
  
  const dueDate = new Date(dueAt);
  const now = new Date();
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isPast = hoursUntilDue < 0;
  const isSoon = hoursUntilDue < 48 && hoursUntilDue >= 0;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-sm",
      isPast && "text-destructive font-medium",
      isSoon && "text-orange-600 dark:text-orange-400 font-medium"
    )}>
      <CalendarClock className="size-4" />
      <span>{formatDistanceToNow(dueDate, { addSuffix: true })}</span>
    </span>
  );
}

import { cn } from "@/lib/utils";

const statusConfig: Record<string, { color: string; label: string }> = {
  new: { color: "bg-blue-500", label: "New" },
  contacted: { color: "bg-yellow-500", label: "Contacted" },
  qualified: { color: "bg-purple-500", label: "Qualified" },
  proposal_sent: { color: "bg-orange-500", label: "Proposal Sent" },
  negotiating: { color: "bg-pink-500", label: "Negotiating" },
  won: { color: "bg-green-500", label: "Won" },
  lost: { color: "bg-red-500", label: "Lost" },
  on_hold: { color: "bg-gray-400", label: "On Hold" },
  in_progress: { color: "bg-yellow-500", label: "In Progress" },
  completed: { color: "bg-green-500", label: "Completed" },
  pending: { color: "bg-orange-500", label: "Pending" },
};

interface StatusIndicatorProps {
  status: string;
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ status, showLabel = true, className }: StatusIndicatorProps) {
  const normalizedStatus = status.toLowerCase().replace(/[\s-]+/g, "_");
  const config = statusConfig[normalizedStatus] || { color: "bg-gray-400", label: status };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("w-2 h-2 rounded-full", config.color)} />
      {showLabel && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}

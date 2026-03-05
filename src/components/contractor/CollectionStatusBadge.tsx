import { cn } from "@/lib/utils";

type CollectionStatus = "ach_sent" | "collected" | "collection_due" | "past_due" | "pending";

interface CollectionStatusBadgeProps {
  status: CollectionStatus;
  className?: string;
}

const statusConfig: Record<CollectionStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  ach_sent: {
    label: "ACH Sent",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  collected: {
    label: "Collected",
    dotColor: "bg-green-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-700 dark:text-green-300",
  },
  collection_due: {
    label: "Collection Due",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  past_due: {
    label: "Past Due",
    dotColor: "bg-red-500",
    bgColor: "bg-red-500/10",
    textColor: "text-red-700 dark:text-red-300",
  },
  pending: {
    label: "Pending",
    dotColor: "bg-gray-400",
    bgColor: "bg-gray-400/10",
    textColor: "text-gray-600 dark:text-gray-400",
  },
};

export function CollectionStatusBadge({ status, className }: CollectionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}

export function getCollectionStatus(dueDate: string | null, paidAt: string | null): CollectionStatus {
  if (paidAt) return "collected";
  if (!dueDate) return "pending";
  
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "past_due";
  if (diffDays <= 7) return "collection_due";
  return "pending";
}

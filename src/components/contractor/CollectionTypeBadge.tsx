import { cn } from "@/lib/utils";

type CollectionType = "open" | "progress" | "final" | "start_finish";

interface CollectionTypeBadgeProps {
  type: CollectionType;
  className?: string;
}

const typeConfig: Record<CollectionType, { label: string; bgColor: string; textColor: string; border?: string }> = {
  open: {
    label: "OPEN",
    bgColor: "bg-transparent",
    textColor: "text-muted-foreground",
    border: "border border-border",
  },
  progress: {
    label: "Progress",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  final: {
    label: "FINAL",
    bgColor: "bg-green-500/10",
    textColor: "text-green-700 dark:text-green-300",
  },
  start_finish: {
    label: "Start/Finish",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-700 dark:text-orange-300",
  },
};

export function CollectionTypeBadge({ type, className }: CollectionTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.open;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        config.bgColor,
        config.textColor,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function getCollectionType(milestoneName: string | null, isOpen: boolean = true): CollectionType {
  if (!milestoneName) return isOpen ? "open" : "progress";
  
  const name = milestoneName.toLowerCase();
  if (name.includes("final")) return "final";
  if (name.includes("start") || name.includes("finish")) return "start_finish";
  return "progress";
}

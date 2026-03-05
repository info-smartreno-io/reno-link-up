import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

interface SortableTableHeaderProps {
  label: string;
  field: string;
  currentSortField: string | null;
  currentSortDirection: SortDirection;
  onSort: (field: string) => void;
  className?: string;
  align?: "left" | "right" | "center";
}

export function SortableTableHeader({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  className,
  align = "left",
}: SortableTableHeaderProps) {
  const isActive = currentSortField === field;

  return (
    <th
      className={cn(
        "px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors select-none",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      onClick={() => onSort(field)}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "flex-row-reverse"
        )}
      >
        <span>{label}</span>
        <span className="text-muted-foreground/50">
          {isActive ? (
            currentSortDirection === "asc" ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          )}
        </span>
      </div>
    </th>
  );
}

// Sort comparators for different data types
export const sortComparators = {
  alphabetical: (a: string | null, b: string | null, direction: SortDirection) => {
    const aVal = a || "";
    const bVal = b || "";
    const result = aVal.localeCompare(bVal);
    return direction === "desc" ? -result : result;
  },
  
  numeric: (a: number | null, b: number | null, direction: SortDirection) => {
    const aVal = a ?? 0;
    const bVal = b ?? 0;
    const result = aVal - bVal;
    return direction === "desc" ? -result : result;
  },
  
  date: (a: string | null, b: string | null, direction: SortDirection) => {
    const aVal = a ? new Date(a).getTime() : 0;
    const bVal = b ? new Date(b).getTime() : 0;
    const result = aVal - bVal;
    return direction === "desc" ? -result : result;
  },
  
  status: (a: string | null, b: string | null, direction: SortDirection) => {
    const statusOrder = ["past_due", "collection_due", "ach_sent", "pending", "collected"];
    const aIndex = statusOrder.indexOf(a || "pending");
    const bIndex = statusOrder.indexOf(b || "pending");
    const result = aIndex - bIndex;
    return direction === "desc" ? -result : result;
  },
};

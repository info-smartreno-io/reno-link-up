import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Column {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => ReactNode;
  className?: string;
  mobileHidden?: boolean;
}

interface MobileOptimizedTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
  mobileCardView?: boolean;
  onRowClick?: (row: any) => void;
}

export function MobileOptimizedTable({
  columns,
  data,
  emptyMessage = "No data available",
  mobileCardView = true,
  onRowClick,
}: MobileOptimizedTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  // Mobile Card View
  if (mobileCardView) {
    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-lg border">
          <ScrollArea className="w-full">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={cn(
                        "px-4 py-3 text-left text-sm font-semibold text-foreground",
                        col.className
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-t transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/50"
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 text-sm">
                        {col.cell
                          ? col.cell(row[col.accessor], row)
                          : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {data.map((row, rowIdx) => (
            <Card
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
            >
              <CardContent className="p-4 space-y-2">
                {columns
                  .filter((col) => !col.mobileHidden)
                  .map((col, colIdx) => (
                    <div key={colIdx} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground min-w-[100px]">
                        {col.header}:
                      </span>
                      <div className="text-sm text-right flex-1">
                        {col.cell
                          ? col.cell(row[col.accessor], row)
                          : row[col.accessor]}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  // Scrollable Table View (for when card view isn't appropriate)
  return (
    <div className="overflow-hidden rounded-lg border">
      <ScrollArea className="w-full">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-foreground whitespace-nowrap",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-t transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm whitespace-nowrap">
                    {col.cell
                      ? col.cell(row[col.accessor], row)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

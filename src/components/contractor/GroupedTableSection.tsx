import { useState } from "react";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GroupedTableSectionProps<T> {
  title: string;
  subtitle?: string;
  items: T[];
  totalAmount?: number;
  completedCount?: number;
  totalCount?: number;
  defaultExpanded?: boolean;
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader: () => React.ReactNode;
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  avatarUrl?: string;
}

export function GroupedTableSection<T>({
  title,
  subtitle,
  items,
  totalAmount,
  completedCount,
  totalCount,
  defaultExpanded = true,
  renderRow,
  renderHeader,
  renderMobileCard,
  onLoadMore,
  hasMore = false,
  avatarUrl,
}: GroupedTableSectionProps<T>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const shouldRenderCards = isMobile && renderMobileCard;

  return (
    <div className="mb-4">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 bg-muted/50 hover:bg-muted transition-colors touch-manipulation",
          "min-h-[52px]",
          isExpanded ? "rounded-t-lg" : "rounded-lg"
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        
        {avatarUrl ? (
          <img src={avatarUrl} alt={title} className="w-6 h-6 rounded-full shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-3 w-3 text-primary" />
          </div>
        )}
        
        {/* Mobile: Stack title and stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-left">
            <span className="font-medium truncate">{title}</span>
            {subtitle && (
              <span className="text-sm text-muted-foreground hidden md:inline">{subtitle}</span>
            )}
          </div>
          
          {/* Mobile: Show stats below title */}
          <div className="md:hidden flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{items.length} items</span>
            {totalAmount !== undefined && (
              <>
                <span>•</span>
                <span className="font-medium text-foreground">{formatCurrency(totalAmount)}</span>
              </>
            )}
          </div>
        </div>

        {/* Desktop: Show stats inline */}
        <div className="hidden md:flex items-center gap-6 text-sm shrink-0">
          <span className="text-muted-foreground">
            {items.length} items
          </span>
          {totalAmount !== undefined && (
            <span className="font-medium text-foreground">
              SUM {formatCurrency(totalAmount)}
            </span>
          )}
          {completedCount !== undefined && totalCount !== undefined && (
            <span className="text-muted-foreground">
              COMPLETE {completedCount}/{totalCount}
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className={cn(
          "border border-t-0 rounded-b-lg overflow-hidden",
          shouldRenderCards && "bg-background"
        )}>
          {shouldRenderCards ? (
            // Mobile Card View
            <div className="p-3 space-y-3">
              {items.map((item, index) => renderMobileCard(item, index))}
            </div>
          ) : (
            // Desktop Table View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  {renderHeader()}
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => renderRow(item, index))}
                </tbody>
              </table>
            </div>
          )}
          
          {hasMore && onLoadMore && (
            <button
              onClick={onLoadMore}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors touch-manipulation min-h-[44px]"
            >
              Load more...
            </button>
          )}
        </div>
      )}
    </div>
  );
}

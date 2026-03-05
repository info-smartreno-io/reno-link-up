import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollectionItem {
  id: string;
  description: string;
  type: string;
  status: string;
  payment_amount: number;
  due_date: string | null;
  project_name?: string;
  customer_name?: string;
  pm_name?: string;
}

interface MobileCollectionCardProps {
  item: CollectionItem;
  onClick?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'collected':
      return { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
        dot: 'bg-green-500',
        label: 'Collected'
      };
    case 'past_due':
    case 'past due':
      return { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', 
        dot: 'bg-red-500',
        label: 'Past Due'
      };
    case 'pending':
      return { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
        dot: 'bg-yellow-500',
        label: 'Pending'
      };
    case 'due_today':
    case 'due today':
      return { 
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
        dot: 'bg-orange-500',
        label: 'Due Today'
      };
    default:
      return { 
        color: 'bg-muted text-muted-foreground', 
        dot: 'bg-muted-foreground',
        label: status
      };
  }
};

const getTypeLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case 'deposit': return 'Deposit';
    case 'progress': return 'Progress';
    case 'final': return 'Final';
    case 'change_order': return 'Change Order';
    default: return type;
  }
};

export function MobileCollectionCard({ item, onClick }: MobileCollectionCardProps) {
  const statusConfig = getStatusConfig(item.status);

  return (
    <Card 
      className={cn(
        "touch-manipulation cursor-pointer transition-all active:scale-[0.98]",
        "border-l-4",
        item.status.toLowerCase() === 'collected' && "border-l-green-500",
        item.status.toLowerCase().includes('past') && "border-l-red-500",
        item.status.toLowerCase() === 'pending' && "border-l-yellow-500",
        item.status.toLowerCase().includes('due_today') && "border-l-orange-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {item.project_name || item.description}
            </p>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {item.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-lg text-foreground">
              {formatCurrency(item.payment_amount)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getTypeLabel(item.type)}
            </Badge>
            <Badge className={cn("text-xs", statusConfig.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig.dot)} />
              {statusConfig.label}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDate(item.due_date)}
          </span>
        </div>

        {(item.customer_name || item.pm_name) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {item.customer_name && <span>{item.customer_name}</span>}
            {item.customer_name && item.pm_name && <span>•</span>}
            {item.pm_name && <span>PM: {item.pm_name}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

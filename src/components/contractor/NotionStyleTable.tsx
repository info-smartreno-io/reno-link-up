import { GroupedTableSection } from "./GroupedTableSection";
import { CategoryBadge } from "./CategoryBadge";
import { StatusIndicator } from "./StatusIndicator";
import { formatDistanceToNow } from "date-fns";

export interface SalesPipelineItem {
  id: string;
  customer_name: string;
  town: string;
  amount: number;
  category: string;
  lead_quality: string;
  probability: number;
  status: string;
  sales_rep: string;
  sales_rep_id: string;
  estimate_date: string;
  days_since_estimate?: number;
}

interface GroupedData {
  groupKey: string;
  groupLabel: string;
  items: SalesPipelineItem[];
  totalAmount: number;
  completedCount: number;
}

interface NotionStyleTableProps {
  data: SalesPipelineItem[];
  groupBy: "sales_rep" | "status" | "category";
  onRowClick?: (item: SalesPipelineItem) => void;
}

export function NotionStyleTable({ data, groupBy, onRowClick }: NotionStyleTableProps) {
  // Group data by the specified field
  const groupedData: GroupedData[] = Object.entries(
    data.reduce((acc, item) => {
      const key = item[groupBy === "sales_rep" ? "sales_rep_id" : groupBy];
      const label = item[groupBy === "sales_rep" ? "sales_rep" : groupBy];
      if (!acc[key]) {
        acc[key] = { groupKey: key, groupLabel: label, items: [], totalAmount: 0, completedCount: 0 };
      }
      acc[key].items.push(item);
      acc[key].totalAmount += item.amount;
      if (item.status === "won" || item.status === "completed") {
        acc[key].completedCount++;
      }
      return acc;
    }, {} as Record<string, GroupedData>)
  ).map(([, group]) => group);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysSinceEstimate = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderHeader = () => (
    <tr>
      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Customer
      </th>
      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Town
      </th>
      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Amount
      </th>
      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Category
      </th>
      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Quality
      </th>
      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Probability
      </th>
      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Status
      </th>
      {groupBy !== "sales_rep" && (
        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Rep
        </th>
      )}
      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Days
      </th>
    </tr>
  );

  const renderRow = (item: SalesPipelineItem, index: number) => {
    const daysSince = getDaysSinceEstimate(item.estimate_date);
    
    return (
      <tr
        key={item.id}
        onClick={() => onRowClick?.(item)}
        className="hover:bg-muted/30 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3 text-sm font-medium">{item.customer_name}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{item.town}</td>
        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
        <td className="px-4 py-3">
          <CategoryBadge category={item.category} />
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            item.lead_quality === "hot" ? "bg-red-100 text-red-800" :
            item.lead_quality === "warm" ? "bg-orange-100 text-orange-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {item.lead_quality}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${item.probability}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.probability}%</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <StatusIndicator status={item.status} />
        </td>
        {groupBy !== "sales_rep" && (
          <td className="px-4 py-3 text-sm text-muted-foreground">{item.sales_rep}</td>
        )}
        <td className="px-4 py-3 text-center">
          {daysSince !== null && (
            <span className={`text-xs ${daysSince > 14 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
              {daysSince}d
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {groupedData.map((group) => (
        <GroupedTableSection
          key={group.groupKey}
          title={group.groupLabel}
          items={group.items}
          totalAmount={group.totalAmount}
          completedCount={group.completedCount}
          totalCount={group.items.length}
          renderHeader={renderHeader}
          renderRow={renderRow}
        />
      ))}
    </div>
  );
}

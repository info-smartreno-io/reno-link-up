import { useState, useMemo } from "react";
import { User } from "lucide-react";
import { GroupedTableSection } from "./GroupedTableSection";
import { CollectionStatusBadge, getCollectionStatus } from "./CollectionStatusBadge";
import { CollectionTypeBadge, getCollectionType } from "./CollectionTypeBadge";
import { SortableTableHeader, SortDirection, sortComparators } from "./SortableTableHeader";
import { MobileCollectionCard } from "./MobileCollectionCard";

export interface CollectionItem {
  id: string;
  description: string;
  milestone_name: string | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  payment_amount: number;
  scheduled_balance: number;
  pm_id: string | null;
  pm_name: string;
  customer_name: string;
  project_id: string | null;
  is_open: boolean;
}

interface GroupedData {
  key: string;
  label: string;
  items: CollectionItem[];
  totalAmount: number;
  completedCount: number;
}

interface CollectionsTableProps {
  data: CollectionItem[];
  groupBy: "pm" | "customer" | "status";
  onRowClick?: (item: CollectionItem) => void;
}

export function CollectionsTable({ data, groupBy, onRowClick }: CollectionsTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortItems = (items: CollectionItem[]): CollectionItem[] => {
    if (!sortField || !sortDirection) return items;

    return [...items].sort((a, b) => {
      switch (sortField) {
        case "description":
          return sortComparators.alphabetical(a.description, b.description, sortDirection);
        case "type":
          return sortComparators.alphabetical(a.milestone_name, b.milestone_name, sortDirection);
        case "status":
          const aStatus = getCollectionStatus(a.due_date, a.paid_at);
          const bStatus = getCollectionStatus(b.due_date, b.paid_at);
          return sortComparators.status(aStatus, bStatus, sortDirection);
        case "due_date":
          return sortComparators.date(a.due_date, b.due_date, sortDirection);
        case "payment_amount":
          return sortComparators.numeric(a.payment_amount, b.payment_amount, sortDirection);
        case "scheduled_balance":
          return sortComparators.numeric(a.scheduled_balance, b.scheduled_balance, sortDirection);
        default:
          return 0;
      }
    });
  };

  const groupedData = useMemo((): GroupedData[] => {
    const groups = new Map<string, CollectionItem[]>();

    data.forEach((item) => {
      let key: string;
      switch (groupBy) {
        case "pm":
          key = item.pm_id || "unassigned";
          break;
        case "customer":
          key = item.customer_name || "Unknown";
          break;
        case "status":
          key = getCollectionStatus(item.due_date, item.paid_at);
          break;
        default:
          key = "all";
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([key, items]) => {
      const sortedItems = sortItems(items);
      let label: string;
      
      switch (groupBy) {
        case "pm":
          label = items[0]?.pm_name || "Unassigned";
          break;
        case "customer":
          label = key;
          break;
        case "status":
          const statusLabels: Record<string, string> = {
            past_due: "Past Due",
            collection_due: "Collection Due",
            ach_sent: "ACH Sent",
            collected: "Collected",
            pending: "Pending",
          };
          label = statusLabels[key] || key;
          break;
        default:
          label = key;
      }

      return {
        key,
        label,
        items: sortedItems,
        totalAmount: items.reduce((sum, item) => sum + (item.payment_amount || 0), 0),
        completedCount: items.filter((item) => item.paid_at).length,
      };
    });
  }, [data, groupBy, sortField, sortDirection]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderHeader = () => (
    <tr>
      <SortableTableHeader
        label="Description"
        field="description"
        currentSortField={sortField}
        currentSortDirection={sortDirection}
        onSort={handleSort}
        className="w-[200px]"
      />
      <SortableTableHeader
        label="Type"
        field="type"
        currentSortField={sortField}
        currentSortDirection={sortDirection}
        onSort={handleSort}
        className="w-[150px]"
      />
      <SortableTableHeader
        label="Status"
        field="status"
        currentSortField={sortField}
        currentSortDirection={sortDirection}
        onSort={handleSort}
        className="w-[140px]"
      />
      <SortableTableHeader
        label="Due"
        field="due_date"
        currentSortField={sortField}
        currentSortDirection={sortDirection}
        onSort={handleSort}
        className="w-[100px]"
      />
      <SortableTableHeader
        label="Payment Amount"
        field="payment_amount"
        currentSortField={sortField}
        currentSortDirection={sortDirection}
        onSort={handleSort}
        className="w-[130px]"
        align="right"
      />
      <SortableTableHeader
        label="Scheduled Balance"
        field="scheduled_balance"
        currentSortField={sortField}
        currentSortDirection={sortDirection}
        onSort={handleSort}
        className="w-[140px]"
        align="right"
      />
      {groupBy !== "pm" && (
        <th className="px-3 py-2 text-xs font-medium text-muted-foreground w-[120px]">
          PM
        </th>
      )}
    </tr>
  );

  const renderRow = (item: CollectionItem, index: number) => {
    const status = getCollectionStatus(item.due_date, item.paid_at);
    const type = getCollectionType(item.milestone_name, item.is_open);

    return (
      <tr
        key={item.id}
        className="hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => onRowClick?.(item)}
      >
        <td className="px-3 py-2 text-sm font-medium">{item.description}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            {item.is_open && <CollectionTypeBadge type="open" />}
            <CollectionTypeBadge type={type} />
          </div>
        </td>
        <td className="px-3 py-2">
          <CollectionStatusBadge status={status} />
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">
          {formatDate(item.due_date)}
        </td>
        <td className="px-3 py-2 text-sm text-right font-medium">
          {formatCurrency(item.payment_amount)}
        </td>
        <td className="px-3 py-2 text-sm text-right text-muted-foreground">
          {formatCurrency(item.scheduled_balance)}
        </td>
        {groupBy !== "pm" && (
          <td className="px-3 py-2 text-sm text-muted-foreground">
            {item.pm_name || "—"}
          </td>
        )}
      </tr>
    );
  };

  const renderMobileCard = (item: CollectionItem, index: number) => {
    const status = getCollectionStatus(item.due_date, item.paid_at);
    const type = getCollectionType(item.milestone_name, item.is_open);

    return (
      <MobileCollectionCard
        key={item.id}
        item={{
          ...item,
          type,
          status,
          project_name: item.customer_name,
        }}
        onClick={() => onRowClick?.(item)}
      />
    );
  };

  return (
    <div className="space-y-4">
      {groupedData.map((group) => (
        <GroupedTableSection
          key={group.key}
          title={group.label}
          items={group.items}
          totalAmount={group.totalAmount}
          completedCount={group.completedCount}
          totalCount={group.items.length}
          defaultExpanded={true}
          renderHeader={renderHeader}
          renderRow={renderRow}
          renderMobileCard={renderMobileCard}
          avatarUrl={undefined}
        />
      ))}
    </div>
  );
}

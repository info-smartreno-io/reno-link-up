import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseSummaryCardsProps {
  totalThisMonth: number;
  totalPending: number;
  totalApproved: number;
  percentChange?: number;
  topCategory?: string;
}

export function ExpenseSummaryCards({
  totalThisMonth,
  totalPending,
  totalApproved,
  percentChange,
  topCategory,
}: ExpenseSummaryCardsProps) {
  const cards = [
    {
      title: "This Month",
      value: `$${totalThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: percentChange !== undefined 
        ? `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}% from last month`
        : undefined,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Pending Approval",
      value: `$${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: Clock,
      description: "Awaiting review",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      title: "Approved",
      value: `$${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: CheckCircle,
      description: "This month",
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Top Category",
      value: topCategory || "—",
      icon: TrendingUp,
      description: "Most spent this month",
      iconColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("p-2 rounded-lg", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{card.value}</div>
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
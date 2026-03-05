import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  PieChart, 
  TrendingUp,
  Calendar,
  Building,
  Loader2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoExpenses, getDemoProjects } from "@/utils/demoContractorData";

const categoryColors: Record<string, string> = {
  'Materials': 'bg-blue-500',
  'Labor': 'bg-orange-500',
  'Equipment': 'bg-purple-500',
  'Travel': 'bg-green-500',
  'Fuel': 'bg-yellow-500',
  'Meals': 'bg-red-500',
  'Office Supplies': 'bg-gray-500',
  'Subcontractor': 'bg-indigo-500',
  'Permits & Fees': 'bg-teal-500',
  'Insurance': 'bg-pink-500',
  'Utilities': 'bg-cyan-500',
  'Other': 'bg-slate-500',
};

export default function ExpenseReports() {
  const [period, setPeriod] = useState("this-month");
  const [groupBy, setGroupBy] = useState("category");
  const { isDemoMode } = useDemoMode();

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        const demoExpenses = getDemoExpenses();
        const demoProjects = getDemoProjects();
        return demoExpenses.map(exp => ({
          id: exp.id,
          description: exp.description,
          category_name: exp.category,
          amount: exp.amount,
          expense_date: exp.date,
          status: exp.status,
          vendor: null,
          contractor_projects: exp.project_name !== "General" 
            ? { project_name: exp.project_name }
            : null,
        }));
      }

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          contractor_projects (
            project_name
          )
        `)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "this-month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last-month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last-3-months":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "last-6-months":
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "this-year":
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense: any) => {
      const expenseDate = parseISO(expense.expense_date);
      return isWithinInterval(expenseDate, dateRange);
    });
  }, [expenses, dateRange]);

  // Group expenses
  const groupedData = useMemo(() => {
    const groups: Record<string, { total: number; count: number; items: any[] }> = {};

    filteredExpenses.forEach((expense: any) => {
      let key: string;
      switch (groupBy) {
        case "category":
          key = expense.category_name || 'Other';
          break;
        case "project":
          key = expense.contractor_projects?.project_name || 'Unassigned';
          break;
        case "vendor":
          key = expense.vendor || 'Unknown Vendor';
          break;
        case "status":
          key = expense.status;
          break;
        default:
          key = expense.category_name || 'Other';
      }

      if (!groups[key]) {
        groups[key] = { total: 0, count: 0, items: [] };
      }
      groups[key].total += parseFloat(expense.amount) || 0;
      groups[key].count += 1;
      groups[key].items.push(expense);
    });

    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, groupBy]);

  // Calculate totals
  const totalAmount = filteredExpenses.reduce(
    (sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 
    0
  );

  const handleExportPDF = () => {
    // For now, export as CSV - PDF would require additional library
    handleExportCSV();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Vendor', 'Amount', 'Status', 'Project'];
    const rows = filteredExpenses.map((e: any) => [
      e.expense_date,
      e.description,
      e.category_name,
      e.vendor || '',
      e.amount,
      e.status,
      e.contractor_projects?.project_name || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expense Reports</h1>
            <p className="text-muted-foreground">
              Analyze spending patterns and generate reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="project">By Project</SelectItem>
                <SelectItem value="vendor">By Vendor</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{filteredExpenses.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. per Transaction</p>
                <p className="text-2xl font-bold">
                  ${filteredExpenses.length > 0 
                    ? (totalAmount / filteredExpenses.length).toLocaleString('en-US', { minimumFractionDigits: 2 })
                    : '0.00'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{groupedData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="breakdown" className="space-y-4">
            <TabsList>
              <TabsTrigger value="breakdown">
                <PieChart className="h-4 w-4 mr-2" />
                Breakdown
              </TabsTrigger>
              <TabsTrigger value="details">
                <TrendingUp className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-4">
              {/* Visual breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    Expenses by {groupBy}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No expenses in this period
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {groupedData.map((group) => {
                        const percentage = totalAmount > 0 
                          ? (group.total / totalAmount) * 100 
                          : 0;
                        const color = categoryColors[group.name] || 'bg-slate-500';

                        return (
                          <div key={group.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", color)} />
                                <span className="font-medium">{group.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({group.count} items)
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold">
                                  ${group.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all", color)}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              {/* Detailed list by group */}
              <div className="space-y-4">
                {groupedData.map((group) => (
                  <Card key={group.name}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <span className="font-bold">
                          ${group.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y">
                        {group.items.slice(0, 5).map((item: any) => (
                          <div 
                            key={item.id} 
                            className="py-2 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-sm">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(item.expense_date), "MMM d, yyyy")}
                                {item.vendor && ` • ${item.vendor}`}
                              </p>
                            </div>
                            <span className="font-medium">
                              ${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        {group.items.length > 5 && (
                          <p className="py-2 text-sm text-muted-foreground text-center">
                            +{group.items.length - 5} more items
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ContractorLayout>
  );
}
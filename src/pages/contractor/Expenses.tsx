import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Button } from "@/components/ui/button";
import { Plus, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExpenseCard } from "@/components/contractor/expenses/ExpenseCard";
import { MobileExpenseCard } from "@/components/contractor/expenses/MobileExpenseCard";
import { AddExpenseDialog } from "@/components/contractor/expenses/AddExpenseDialog";
import { ExpenseFilters, ExpenseFilterValues } from "@/components/contractor/expenses/ExpenseFilters";
import { ExpenseSummaryCards } from "@/components/contractor/expenses/ExpenseSummaryCards";
import { useIsMobile } from "@/hooks/use-mobile";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoExpenses, getDemoProjects } from "@/utils/demoContractorData";

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { isDemoMode } = useDemoMode();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [filters, setFilters] = useState<ExpenseFilterValues>({
    search: "",
    category: "all",
    status: "all",
    project: "all",
    dateRange: undefined,
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoExpenses().map(e => ({
          id: e.id,
          description: e.description,
          category_name: e.category,
          amount: e.amount,
          expense_date: e.date,
          status: e.status,
          receipt_path: e.receipt_url,
          vendor: null,
          project_id: null,
          contractor_projects: { project_name: e.project_name },
        }));
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return [
          { id: '1', name: 'Materials' },
          { id: '2', name: 'Labor' },
          { id: '3', name: 'Equipment' },
          { id: '4', name: 'Travel' },
          { id: '5', name: 'Permits' },
        ];
      }
      
      const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['contractor-projects-list', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoProjects().map(p => ({
          id: p.id,
          project_name: p.name,
        }));
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('contractor_projects')
        .select('id, project_name')
        .order('project_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Expense deleted" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting expense", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('expenses')
        .update({ 
          status,
          ...(status === 'approved' && { approved_by: user?.id, approved_at: new Date().toISOString() }),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: `Expense ${status}` });
    },
  });

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense: any) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          expense.description?.toLowerCase().includes(searchLower) ||
          expense.vendor?.toLowerCase().includes(searchLower) ||
          expense.category_name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== "all" && expense.category_name !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status !== "all" && expense.status !== filters.status) {
        return false;
      }

      // Project filter
      if (filters.project !== "all") {
        if (filters.project === "none" && expense.project_id) return false;
        if (filters.project !== "none" && expense.project_id !== filters.project) return false;
      }

      // Date range filter
      if (filters.dateRange?.from) {
        const expenseDate = parseISO(expense.expense_date);
        const from = filters.dateRange.from;
        const to = filters.dateRange.to || filters.dateRange.from;
        if (!isWithinInterval(expenseDate, { start: from, end: to })) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, filters]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    let pendingTotal = 0;
    let approvedTotal = 0;
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((expense: any) => {
      const expenseDate = parseISO(expense.expense_date);
      const amount = parseFloat(expense.amount) || 0;

      // This month totals
      if (isWithinInterval(expenseDate, { start: thisMonthStart, end: thisMonthEnd })) {
        thisMonthTotal += amount;
        
        if (expense.status === 'pending') pendingTotal += amount;
        if (expense.status === 'approved') approvedTotal += amount;

        // Track category totals
        const cat = expense.category_name || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
      }

      // Last month totals
      if (isWithinInterval(expenseDate, { start: lastMonthStart, end: lastMonthEnd })) {
        lastMonthTotal += amount;
      }
    });

    const percentChange = lastMonthTotal > 0 
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      totalThisMonth: thisMonthTotal,
      totalPending: pendingTotal,
      totalApproved: approvedTotal,
      percentChange,
      topCategory,
    };
  }, [expenses]);

  const handleViewReceipt = async (path: string) => {
    const { data } = await supabase.storage
      .from('expense-receipts')
      .createSignedUrl(path, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleExport = () => {
    // Export filtered expenses as CSV
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
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Track and manage business expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <ExpenseSummaryCards {...summaryStats} />

        {/* Filters */}
        <ExpenseFilters
          onFiltersChange={setFilters}
          categories={categories}
          projects={projects}
        />

        {/* Expense List */}
        {expensesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No expenses found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first expense
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense: any) => (
              isMobile ? (
                <MobileExpenseCard
                  key={expense.id}
                  expense={expense}
                  onClick={(e) => setEditExpense(e)}
                />
              ) : (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={setEditExpense}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onApprove={(id) => updateStatusMutation.mutate({ id, status: 'approved' })}
                  onReject={(id) => updateStatusMutation.mutate({ id, status: 'rejected' })}
                  onViewReceipt={handleViewReceipt}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <AddExpenseDialog
        open={isAddOpen || !!editExpense}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditExpense(null);
          }
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          setEditExpense(null);
        }}
        editExpense={editExpense}
        categories={categories}
        projects={projects}
      />
    </ContractorLayout>
  );
}
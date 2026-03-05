import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Receipt, 
  TrendingUp,
  CalendarClock,
  Percent
} from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoFinanceSnapshot } from "@/utils/demoContractorData";

interface SnapshotMetric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

export function FinanceSnapshot() {
  const { isDemoMode } = useDemoMode();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['finance-snapshot', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoFinanceSnapshot();
      }

      const now = new Date();
      const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get active contracts
      const { count: activeContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('signature_status', 'signed');

      // Get deposits pending (payment schedules with milestone_order = 1 and status = pending)
      const { count: depositsPending } = await supabase
        .from('payment_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('milestone_order', 1)
        .eq('status', 'pending');

      // Get installments due in next 14 days
      const { count: installmentsDue } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .lte('due_date', fourteenDaysFromNow.toISOString())
        .gte('due_date', now.toISOString());

      // Get overdue payments
      const { count: overduePayments } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .in('status', ['sent', 'partially_paid'])
        .lt('due_date', now.toISOString());

      // Get approved but unbilled change orders
      const { count: unbilledCOs } = await supabase
        .from('change_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('billed', false);

      // Get collected this month
      const { data: paymentsThisMonth } = await supabase
        .from('invoice_payments')
        .select('amount')
        .gte('payment_date', startOfMonth.toISOString());

      const collectedThisMonth = paymentsThisMonth?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get outstanding AR
      const { data: outstandingInvoices } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid')
        .in('status', ['sent', 'partially_paid']);

      const outstandingAR = outstandingInvoices?.reduce(
        (sum, inv) => sum + (Number(inv.total_amount) - Number(inv.amount_paid || 0)), 
        0
      ) || 0;

      // Calculate avg days to collect (simplified)
      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('invoice_date, paid_at')
        .eq('status', 'paid')
        .not('paid_at', 'is', null)
        .limit(50);

      let avgDays = 0;
      if (paidInvoices && paidInvoices.length > 0) {
        const totalDays = paidInvoices.reduce((sum, inv) => {
          const issued = new Date(inv.invoice_date);
          const paid = new Date(inv.paid_at!);
          return sum + Math.ceil((paid.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDays = Math.round(totalDays / paidInvoices.length);
      }

      return {
        activeContracts: activeContracts || 0,
        depositsPending: depositsPending || 0,
        installmentsDue: installmentsDue || 0,
        overduePayments: overduePayments || 0,
        unbilledCOs: unbilledCOs || 0,
        collectedThisMonth,
        outstandingAR,
        avgDaysToCollect: avgDays
      };
    }
  });

  const snapshotMetrics: SnapshotMetric[] = [
    {
      label: "Active Contracts",
      value: metrics?.activeContracts || 0,
      icon: <FileText className="h-5 w-5" />,
      color: "text-primary"
    },
    {
      label: "Deposits Pending",
      value: metrics?.depositsPending || 0,
      icon: <Clock className="h-5 w-5" />,
      color: metrics?.depositsPending ? "text-amber-500" : "text-muted-foreground"
    },
    {
      label: "Installments Due (14d)",
      value: metrics?.installmentsDue || 0,
      icon: <CalendarClock className="h-5 w-5" />,
      color: "text-blue-500"
    },
    {
      label: "Overdue Payments",
      value: metrics?.overduePayments || 0,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: metrics?.overduePayments ? "text-destructive" : "text-muted-foreground"
    },
    {
      label: "Approved COs Unbilled",
      value: metrics?.unbilledCOs || 0,
      icon: <Receipt className="h-5 w-5" />,
      color: metrics?.unbilledCOs ? "text-amber-500" : "text-muted-foreground"
    },
    {
      label: "Collected This Month",
      value: `$${(metrics?.collectedThisMonth || 0).toLocaleString()}`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-emerald-500"
    },
    {
      label: "Outstanding AR",
      value: `$${(metrics?.outstandingAR || 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: metrics?.outstandingAR ? "text-amber-500" : "text-muted-foreground"
    },
    {
      label: "Avg Days to Collect",
      value: metrics?.avgDaysToCollect || 0,
      icon: <Percent className="h-5 w-5" />,
      color: "text-muted-foreground"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-10 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {snapshotMetrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={metric.color}>{metric.icon}</span>
            </div>
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

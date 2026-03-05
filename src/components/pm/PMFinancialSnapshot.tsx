import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, CreditCard, Check, Clock, AlertTriangle } from "lucide-react";

interface PMFinancialSnapshotProps {
  projectId: string;
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString()}`;
}

function BudgetStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    'under': { className: 'bg-green-500/20 text-green-500', label: 'Under', icon: <Check className="h-3 w-3 mr-1" /> },
    'on_track': { className: 'bg-blue-500/20 text-blue-500', label: 'On Track', icon: <Check className="h-3 w-3 mr-1" /> },
    'over': { className: 'bg-red-500/20 text-red-500', label: 'Over', icon: <AlertTriangle className="h-3 w-3 mr-1" /> }
  };
  const variant = variants[status] || variants['on_track'];
  return <Badge className={`${variant.className} border-0 flex items-center`}>{variant.icon}{variant.label}</Badge>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    'paid': { className: 'bg-green-500/20 text-green-500', label: 'Paid', icon: <Check className="h-3 w-3 mr-1" /> },
    'pending': { className: 'bg-amber-500/20 text-amber-500', label: 'Pending', icon: <Clock className="h-3 w-3 mr-1" /> },
    'overdue': { className: 'bg-red-500/20 text-red-500', label: 'Overdue', icon: <AlertTriangle className="h-3 w-3 mr-1" /> }
  };
  const variant = variants[status] || variants['pending'];
  return <Badge className={`${variant.className} border-0 flex items-center`}>{variant.icon}{variant.label}</Badge>;
}

export function PMFinancialSnapshot({ projectId }: PMFinancialSnapshotProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pm-financial-snapshot', projectId],
    queryFn: async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('estimated_budget')
        .eq('id', projectId)
        .single();

      const { data: changeOrders } = await supabase
        .from('change_orders')
        .select('change_amount')
        .eq('project_id', projectId)
        .eq('status', 'approved');

      const approvedCOs = changeOrders?.reduce((sum, co) => sum + (co.change_amount || 0), 0) || 0;
      const contractValue = project?.estimated_budget || 0;

      return { contractValue, approvedCOs, budgetStatus: 'on_track', nextInstallmentDue: null, paymentStatus: 'pending' };
    }
  });

  if (isLoading) {
    return <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div></CardContent></Card>;
  }

  const metrics = [
    { label: 'Contract Value', value: formatCurrency(data?.contractValue || 0), icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Approved COs', value: formatCurrency(data?.approvedCOs || 0), icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
    { label: 'Budget Status', value: <BudgetStatusBadge status={data?.budgetStatus || 'on_track'} />, icon: null },
    { label: 'Next Installment Due', value: data?.nextInstallmentDue || '—', icon: <Calendar className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Payment Status', value: <PaymentStatusBadge status={data?.paymentStatus || 'pending'} />, icon: <CreditCard className="h-4 w-4 text-muted-foreground" /> }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Financial Snapshot</CardTitle>
        <p className="text-xs text-muted-foreground">PM View - Limited</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">{metric.icon}<span className="text-sm text-muted-foreground">{metric.label}</span></div>
              <span className="text-sm font-medium">{metric.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
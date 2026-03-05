import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, DollarSign } from "lucide-react";

interface PMChangeOrdersPanelProps {
  projectId: string;
}

interface ChangeOrder {
  id: string;
  change_order_number: string;
  description: string;
  status: string;
  change_amount: number;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    'approved': { className: 'bg-green-500/20 text-green-500', label: 'Approved' },
    'pending': { className: 'bg-amber-500/20 text-amber-500', label: 'Pending' },
    'draft': { className: 'bg-muted text-muted-foreground', label: 'Draft' },
    'rejected': { className: 'bg-red-500/20 text-red-500', label: 'Rejected' }
  };

  const variant = variants[status] || variants['draft'];

  return (
    <Badge className={`${variant.className} border-0`}>
      {variant.label}
    </Badge>
  );
}

function formatCurrency(amount: number) {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}$${Math.abs(amount).toLocaleString()}`;
}

export function PMChangeOrdersPanel({ projectId }: PMChangeOrdersPanelProps) {
  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ['pm-change-orders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_orders')
        .select('id, change_order_number, description, status, change_amount')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChangeOrder[];
    }
  });

  const pendingCount = changeOrders?.filter(co => co.status === 'pending' || co.status === 'draft').length || 0;
  const totalApproved = changeOrders
    ?.filter(co => co.status === 'approved')
    .reduce((sum, co) => sum + (co.change_amount || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Change Orders</CardTitle>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {pendingCount} Pending
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-green-500">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(totalApproved)}
            </Badge>
          </div>
        </div>
        {pendingCount > 0 && (
          <p className="text-xs text-amber-500 mt-1">
            ⚠ Unapproved COs automatically flag project as "At Risk"
          </p>
        )}
      </CardHeader>
      <CardContent>
        {changeOrders && changeOrders.length > 0 ? (
          <div className="space-y-3">
            {changeOrders.map((co) => (
              <div
                key={co.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  co.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-muted/30'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium">{co.change_order_number}</span>
                    <StatusBadge status={co.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {co.description}
                  </p>
                </div>
                <span className={`text-sm font-medium ml-4 ${
                  co.change_amount >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatCurrency(co.change_amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No change orders
          </p>
        )}
      </CardContent>
    </Card>
  );
}
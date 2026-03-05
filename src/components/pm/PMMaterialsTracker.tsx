import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PMMaterialsTrackerProps {
  projectId: string;
  projectStartDate?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    'delivered': { className: 'bg-green-500/20 text-green-500', label: 'Delivered' },
    'ordered': { className: 'bg-blue-500/20 text-blue-500', label: 'Ordered' },
    'backordered': { className: 'bg-amber-500/20 text-amber-500', label: 'Backordered' },
    'pending': { className: 'bg-muted text-muted-foreground', label: 'Pending' }
  };
  const variant = variants[status] || variants['pending'];
  return <Badge className={`${variant.className} border-0`}>{variant.label}</Badge>;
}

export function PMMaterialsTracker({ projectId, projectStartDate }: PMMaterialsTrackerProps) {
  const { data: materials, isLoading } = useQuery({
    queryKey: ['pm-materials', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_materials')
        .select('id, item_name, status, expected_delivery')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!projectId
  });

  const hasDelayedMaterials = materials?.some(m => m.status === 'backordered');

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Materials Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Materials Tracker</CardTitle>
          {hasDelayedMaterials && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />Delay Risk
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!materials || materials.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No materials tracked</p>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div key={material.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${material.status === 'backordered' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-muted/30'}`}>
                <span className="text-sm font-medium">{material.item_name}</span>
                <div className="flex items-center gap-3">
                  <StatusBadge status={material.status || 'pending'} />
                  <span className="text-xs text-muted-foreground">
                    {material.expected_delivery ? new Date(material.expected_delivery).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
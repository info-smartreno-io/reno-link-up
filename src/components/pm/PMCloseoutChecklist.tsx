import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertOctagon, Lock, Check, X } from "lucide-react";
interface PMCloseoutChecklistProps {
  projectId: string;
}

interface CloseoutItem {
  id: string;
  item_name: string;
  item_type: string;
  status: string;
  completed_at: string | null;
}

const defaultCloseoutItems = [
  { item_name: 'Final walk-through', item_type: 'final_walk' },
  { item_name: 'Punch list complete', item_type: 'punch_list' },
  { item_name: 'Pictures & videos uploaded', item_type: 'documentation' },
  { item_name: 'Warranty issued', item_type: 'warranty' },
  { item_name: 'Review requested', item_type: 'review' },
  { item_name: 'Testimonial received', item_type: 'testimonial' },
  { item_name: '6-month follow-up scheduled', item_type: 'follow_up' }
];

export function PMCloseoutChecklist({ projectId }: PMCloseoutChecklistProps) {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['pm-closeout-checklist', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_closeout_items')
        .select('id, item_name, item_type, status, completed_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // If no items exist, create default ones
      if (!data || data.length === 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: newItems, error: insertError } = await supabase
          .from('project_closeout_items')
          .insert(
            defaultCloseoutItems.map(item => ({
              project_id: projectId,
              item_name: item.item_name,
              item_type: item.item_type,
              status: 'pending'
            }))
          )
          .select('id, item_name, item_type, status, completed_at');

        if (insertError) throw insertError;
        return newItems || [];
      }

      return data as CloseoutItem[];
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('project_closeout_items')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          completed_by: status === 'completed' ? user?.id : null
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-closeout-checklist', projectId] });
    }
  });

  const handleToggle = (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateItemMutation.mutate({ itemId, status: newStatus });
  };

  const completedCount = items?.filter(i => i.status === 'completed').length || 0;
  const totalCount = items?.length || 0;
  const allComplete = completedCount === totalCount && totalCount > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={allComplete ? 'border-green-500/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Closeout Checklist</CardTitle>
          <Badge variant={allComplete ? 'default' : 'secondary'}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
        {!allComplete && (
          <div className="flex items-center gap-2 text-amber-500 text-xs mt-2">
            <Lock className="h-3 w-3" />
            <span>Project cannot be marked "Completed" until all are checked</span>
          </div>
        )}
        {allComplete && (
          <div className="flex items-center gap-2 text-green-500 text-xs mt-2">
            <AlertOctagon className="h-3 w-3" />
            <span>Ready to mark project as Completed</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items?.map((item) => {
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                  isCompleted ? 'bg-green-500/10' : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleToggle(item.id, item.status)}
                    className="h-5 w-5"
                  />
                  <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                    {item.item_name}
                  </span>
                </div>
                {isCompleted ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
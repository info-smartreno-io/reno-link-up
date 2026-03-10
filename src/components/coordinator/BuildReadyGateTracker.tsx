import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, XCircle, AlertTriangle, Loader2 } from "lucide-react";

interface BuildReadyGateTrackerProps {
  projectId: string;
  isReadOnly?: boolean;
}

const DEFAULT_GATES = [
  { gate_type: "contract_signed", gate_name: "Contract signed", owner: "Financing", sort_order: 1 },
  { gate_type: "deposit_received", gate_name: "Deposit received", owner: "Financing", sort_order: 2 },
  { gate_type: "final_plans", gate_name: "Final plans complete", owner: "Construction Agent", sort_order: 3 },
  { gate_type: "scope_approved", gate_name: "Final scope approved", owner: "Homeowner", sort_order: 4 },
  { gate_type: "zoning_prepared", gate_name: "Zoning prepared", owner: "PC", sort_order: 5 },
  { gate_type: "permit_prepared", gate_name: "Permit prepared", owner: "PC", sort_order: 6 },
  { gate_type: "subs_awarded", gate_name: "Subs awarded", owner: "PC", sort_order: 7 },
  { gate_type: "budget_finalized", gate_name: "Budget finalized", owner: "PC", sort_order: 8 },
  { gate_type: "materials_ordered", gate_name: "Materials ordered", owner: "PC", sort_order: 9 },
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "in_progress":
      return <Clock className="h-5 w-5 text-amber-600" />;
    case "blocked":
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    default:
      return <XCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

export function BuildReadyGateTracker({ projectId, isReadOnly = false }: BuildReadyGateTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingGate, setUpdatingGate] = useState<string | null>(null);

  const { data: gates = [], isLoading } = useQuery({
    queryKey: ["build-gates", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("build_gates")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;

      // If no gates exist, initialize with defaults
      if (!data || data.length === 0) {
        const { data: newGates, error: insertError } = await supabase
          .from("build_gates")
          .insert(
            DEFAULT_GATES.map(g => ({
              project_id: projectId,
              ...g,
              status: "pending",
            }))
          )
          .select();

        if (insertError) throw insertError;
        return newGates || [];
      }

      return data;
    },
  });

  const toggleGateMutation = useMutation({
    mutationFn: async ({ gateId, completed }: { gateId: string; completed: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("build_gates")
        .update({
          status: completed ? "completed" : "pending",
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? user.user?.id : null,
        })
        .eq("id", gateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-gates", projectId] });
      toast({ title: "Gate updated" });
    },
    onError: () => {
      toast({ title: "Failed to update gate", variant: "destructive" });
    },
    onSettled: () => {
      setUpdatingGate(null);
    },
  });

  const completedCount = gates.filter(g => g.status === "completed").length;
  const totalCount = gates.length;
  const allComplete = completedCount === totalCount && totalCount > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Build-Ready Gates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={allComplete ? "border-green-500/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Build-Ready Gates
              {allComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <CardDescription>
              Project cannot move forward until all gates are complete
            </CardDescription>
          </div>
          <Badge variant={allComplete ? "default" : "secondary"}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {gates.map((gate) => {
          const isCompleted = gate.status === "completed";
          const isUpdating = updatingGate === gate.id;
          const canEdit = !isReadOnly && gate.owner === "PC";

          return (
            <div
              key={gate.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isCompleted 
                  ? "bg-green-500/10 border-green-500/30" 
                  : gate.status === "blocked"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-muted/30 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                {canEdit ? (
                  <Checkbox
                    checked={isCompleted}
                    disabled={isUpdating}
                    onCheckedChange={(checked) => {
                      setUpdatingGate(gate.id);
                      toggleGateMutation.mutate({ gateId: gate.id, completed: !!checked });
                    }}
                  />
                ) : (
                  <StatusIcon status={gate.status} />
                )}
                <div>
                  <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {gate.gate_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {gate.owner}
                </Badge>
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          );
        })}

        {!allComplete && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Complete all gates before proposing start date
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

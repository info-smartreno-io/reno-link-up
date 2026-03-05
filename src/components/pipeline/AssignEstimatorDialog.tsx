import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, User, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Estimator {
  id: string;
  user_id: string;
  full_name: string;
  current_assignments: number;
  is_active: boolean;
}

interface AssignEstimatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  leadName: string;
  onAssigned: () => void;
}

export function AssignEstimatorDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onAssigned,
}: AssignEstimatorDialogProps) {
  const { toast } = useToast();
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const [selectedEstimator, setSelectedEstimator] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEstimators();
    }
  }, [open]);

  const fetchEstimators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("estimators")
        .select(`
          id,
          user_id,
          current_assignment_count,
          is_active,
          profiles!estimators_user_id_fkey(full_name)
        `)
        .eq("is_active", true)
        .order("current_assignment_count", { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        full_name: e.profiles?.full_name || "Unknown",
        current_assignments: e.current_assignments || 0,
        is_active: e.is_active,
      }));

      setEstimators(mapped);
    } catch (error) {
      console.error("Error fetching estimators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!leadId || !selectedEstimator) return;

    setAssigning(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          estimator_id: selectedEstimator,
          status: "call_24h", // Move to next stage after assignment
        })
        .eq("id", leadId);

      if (error) throw error;

      // Update estimator assignment count
      const estimator = estimators.find((e) => e.user_id === selectedEstimator);
      if (estimator) {
        await supabase
          .from("estimators")
          .update({
            current_assignments: estimator.current_assignments + 1,
          })
          .eq("user_id", selectedEstimator);
      }

      toast({
        title: "Estimator assigned",
        description: `${leadName} has been assigned to ${estimators.find((e) => e.user_id === selectedEstimator)?.full_name}`,
      });

      onAssigned();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error assigning estimator:", error);
      toast({
        title: "Error",
        description: "Failed to assign estimator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!leadId) return;

    setAutoAssigning(true);
    try {
      // Auto-assign to estimator with lowest load
      const lowestLoadEstimator = estimators[0];
      if (!lowestLoadEstimator) {
        toast({
          title: "No estimators available",
          description: "There are no active estimators to assign.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("leads")
        .update({
          estimator_id: lowestLoadEstimator.user_id,
          status: "call_24h",
        })
        .eq("id", leadId);

      if (error) throw error;

      await supabase
        .from("estimators")
        .update({
          current_assignments: lowestLoadEstimator.current_assignments + 1,
        })
        .eq("user_id", lowestLoadEstimator.user_id);

      toast({
        title: "Estimator auto-assigned",
        description: `${leadName} has been assigned to ${lowestLoadEstimator.full_name}`,
      });

      onAssigned();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error auto-assigning estimator:", error);
      toast({
        title: "Error",
        description: "Failed to auto-assign estimator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Estimator to {leadName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : estimators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active estimators available
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleAutoAssign}
              disabled={autoAssigning}
            >
              {autoAssigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Auto-Assign (Lowest Load)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or select manually
                </span>
              </div>
            </div>

            <RadioGroup
              value={selectedEstimator}
              onValueChange={setSelectedEstimator}
              className="space-y-2"
            >
              {estimators.map((estimator) => (
                <div
                  key={estimator.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem value={estimator.user_id} id={estimator.id} />
                  <Label
                    htmlFor={estimator.id}
                    className="flex-1 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{estimator.full_name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {estimator.current_assignments} active
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAssign}
                disabled={!selectedEstimator || assigning}
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Assign
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

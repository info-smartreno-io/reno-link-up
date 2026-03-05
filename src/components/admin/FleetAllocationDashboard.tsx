import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

interface CrewAllocation {
  crewId: string;
  assignedProject: string;
  reason: string;
  start_date?: string;
  duration_days?: number;
}

interface AllocationResult {
  allocation_plan: CrewAllocation[];
  efficiency_gain: string;
  conflicts: string[];
  resource_utilization?: string;
  recommendations?: string[];
}

export function FleetAllocationDashboard() {
  const [loading, setLoading] = useState(false);
  const [contractorId, setContractorId] = useState("");
  const [result, setResult] = useState<AllocationResult | null>(null);
  const { toast } = useToast();

  const allocateFleet = async () => {
    if (!contractorId) {
      toast({
        title: "Missing Information",
        description: "Please provide a Contractor ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-fleet-allocation", {
        body: {
          contractorId,
          crews: [
            { id: "C1", specialty: "tile", available: true },
            { id: "C2", specialty: "framing", available: true }
          ],
          projectTimelines: [],
          skillSets: [],
          delayRisks: []
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Fleet Allocated",
        description: `Optimized allocation for ${data.allocation_plan.length} crews`
      });
    } catch (error) {
      console.error("Error allocating fleet:", error);
      toast({
        title: "Error",
        description: "Failed to allocate fleet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Enterprise Fleet Allocation
        </CardTitle>
        <CardDescription>
          AI-powered crew allocation for multi-project contractors
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Contractor ID (Enterprise)</label>
          <Input
            value={contractorId}
            onChange={(e) => setContractorId(e.target.value)}
            placeholder="Enter contractor ID"
          />
        </div>

        <Button onClick={allocateFleet} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Optimize Fleet Allocation
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">{result.efficiency_gain}</div>
                <div className="text-sm text-muted-foreground">Efficiency Gain</div>
              </div>
              {result.resource_utilization && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">{result.resource_utilization}</div>
                  <div className="text-sm text-muted-foreground">Resource Utilization</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Crew Allocation Plan</h3>
              {result.allocation_plan.map((allocation, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">Crew {allocation.crewId}</div>
                      <div className="text-sm text-muted-foreground">→ Project {allocation.assignedProject}</div>
                    </div>
                    {allocation.duration_days && (
                      <span className="text-sm text-muted-foreground">{allocation.duration_days} days</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{allocation.reason}</p>
                  {allocation.start_date && (
                    <p className="text-xs text-muted-foreground mt-1">Starts: {allocation.start_date}</p>
                  )}
                </div>
              ))}
            </div>

            {result.conflicts && result.conflicts.length > 0 && (
              <div className="p-4 border rounded-lg bg-destructive/5">
                <h3 className="font-semibold mb-2 text-destructive">Conflicts Detected</h3>
                <ul className="space-y-1">
                  {result.conflicts.map((conflict, idx) => (
                    <li key={idx} className="text-sm">• {conflict}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="p-4 border rounded-lg bg-primary/5">
                <h3 className="font-semibold mb-2">AI Recommendations</h3>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

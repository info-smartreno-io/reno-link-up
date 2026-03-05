import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Scale } from "lucide-react";

interface LoadDistribution {
  contractorId: string;
  recommendedProjects: number;
}

interface BalancerResult {
  recommended_load_distribution: LoadDistribution[];
  balancing_notes: string;
}

export function WorkloadBalancerPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BalancerResult | null>(null);
  const { toast } = useToast();

  const balanceWorkload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-workload-balancer", {
        body: {
          contractorPool: ["C1", "C3", "C7", "C9"],
          projectAssignments: [],
          availabilityScores: [],
          performanceScores: []
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Workload Balanced",
        description: "Load distribution recommendations generated"
      });
    } catch (error) {
      console.error("Error balancing workload:", error);
      toast({
        title: "Error",
        description: "Failed to balance workload",
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
          <Scale className="h-5 w-5" />
          Workload Balancer
        </CardTitle>
        <CardDescription>
          AI-powered contractor load distribution
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button onClick={balanceWorkload} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Balance Contractor Workload
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Recommended Distribution</h3>
              {result.recommended_load_distribution.map((dist, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Contractor {dist.contractorId}</div>
                    <div className="text-2xl font-bold text-primary">{dist.recommendedProjects}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Recommended Projects</div>
                </div>
              ))}
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Balancing Notes</h3>
              <p className="text-sm">{result.balancing_notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

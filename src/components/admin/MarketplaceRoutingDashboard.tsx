import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Network } from "lucide-react";

interface RankedContractor {
  contractorId: string;
  score: number;
  reason: string;
}

interface OrchestratorResult {
  ranked_contractors: RankedContractor[];
  auto_routing_decision: boolean;
  selected_contractors: string[];
}

export function MarketplaceRoutingDashboard() {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const { toast } = useToast();

  const runOrchestrator = async () => {
    if (!projectId) {
      toast({
        title: "Missing Information",
        description: "Please provide a Project ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-marketplace-orchestrator", {
        body: {
          projectId,
          scope: { type: "Kitchen Remodel" },
          budgetRange: "$50k-$80k",
          zip: "07601",
          projectType: "kitchen",
          contractorPool: ["C1", "C7", "C3", "C9"],
          performanceVectors: [],
          availability: [],
          workload: []
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Routing Complete",
        description: `Selected ${data.selected_contractors.length} contractors`
      });
    } catch (error) {
      console.error("Error running orchestrator:", error);
      toast({
        title: "Error",
        description: "Failed to run marketplace orchestrator",
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
          <Network className="h-5 w-5" />
          Marketplace Routing Orchestrator
        </CardTitle>
        <CardDescription>
          AI-powered autonomous contractor routing
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Project ID</label>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID"
          />
        </div>

        <Button onClick={runOrchestrator} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run Autonomous Routing
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-2">Auto-Routing Decision</div>
              <div className="text-2xl font-bold text-primary">
                {result.auto_routing_decision ? "Enabled" : "Manual Review Required"}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Ranked Contractors</h3>
              {result.ranked_contractors.map((contractor, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Contractor {contractor.contractorId}</div>
                    <div className="text-2xl font-bold text-primary">{contractor.score}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{contractor.reason}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border rounded-lg bg-primary/5">
              <h3 className="font-semibold mb-2">Selected Contractors</h3>
              <div className="flex flex-wrap gap-2">
                {result.selected_contractors.map((id, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

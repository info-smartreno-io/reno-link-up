import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Route } from "lucide-react";

interface PriorityItem {
  contractorId: string;
  priority: number;
}

interface RoutingResult {
  priority_list: PriorityItem[];
  reasoning: string;
  boost_applied: boolean;
}

export function PremiumRoutingPanel() {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<RoutingResult | null>(null);
  const { toast } = useToast();

  const runPremiumRouting = async () => {
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
      const { data, error } = await supabase.functions.invoke("ai-premium-routing", {
        body: {
          projectId,
          contractorPool: ["contractor1", "contractor2", "contractor3"],
          contractorScores: {
            contractor1: 85,
            contractor2: 72,
            contractor3: 91
          },
          budget: "$75,000",
          location: "Bergen County, NJ",
          preferredTrades: ["general_contractor", "kitchen_specialist"]
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Routing Complete",
        description: `Ranked ${data.priority_list.length} contractors${data.boost_applied ? " (Pro+ boost applied)" : ""}`
      });
    } catch (error) {
      console.error("Error running premium routing:", error);
      toast({
        title: "Error",
        description: "Failed to run premium routing",
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
          <Route className="h-5 w-5" />
          Premium Routing Engine
        </CardTitle>
        <CardDescription>
          Priority routing for Pro+ contractors
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

        <Button onClick={runPremiumRouting} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run Premium Routing
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">Routing Strategy</h3>
                {result.boost_applied && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    Pro+ Boost
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{result.reasoning}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Priority Ranking</h3>
              {result.priority_list.map((item) => (
                <div key={item.contractorId} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">#{item.priority}</div>
                    <div className="text-sm text-muted-foreground">{item.contractorId}</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">#{item.priority}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

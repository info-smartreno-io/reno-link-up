import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";

interface LeadScore {
  lead_score: number;
  fit_reason: string;
  conversion_probability: number;
  recommended_pitch: string;
}

export function LeadScoringPanel() {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [result, setResult] = useState<LeadScore | null>(null);
  const { toast } = useToast();

  const scoreProject = async () => {
    if (!projectId || !contractorId) {
      toast({
        title: "Missing Information",
        description: "Please provide both Project ID and Contractor ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-lead-scorer", {
        body: {
          projectId,
          contractorId,
          homeownerProfile: {},
          scope: {},
          budget: "$50,000"
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Lead Scored Successfully",
        description: `Score: ${data.lead_score}/100 (${(data.conversion_probability * 100).toFixed(0)}% conversion probability)`
      });
    } catch (error) {
      console.error("Error scoring lead:", error);
      toast({
        title: "Error",
        description: "Failed to score lead",
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
          <TrendingUp className="h-5 w-5" />
          AI Lead Scoring (Pro+)
        </CardTitle>
        <CardDescription>
          Score leads based on fit, budget, and conversion probability
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Project ID</label>
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project ID"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Contractor ID</label>
            <Input
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              placeholder="Enter contractor ID"
            />
          </div>
        </div>

        <Button onClick={scoreProject} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Score Lead
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">{result.lead_score}/100</div>
                <div className="text-sm text-muted-foreground">Lead Score</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">
                  {(result.conversion_probability * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Conversion Probability</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Why This Lead Fits</h3>
              <p className="text-sm text-muted-foreground">{result.fit_reason}</p>
            </div>

            <div className="p-4 border rounded-lg bg-primary/5">
              <h3 className="font-semibold mb-2">Recommended Pitch</h3>
              <p className="text-sm">{result.recommended_pitch}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

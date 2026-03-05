import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GitBranch } from "lucide-react";

interface SkillGraph {
  skills: string[];
  optimal_budgets: string[];
  ideal_zip_codes: string[];
  recommendations: string[];
  graphId: string;
}

export function SkillGraphViewer() {
  const [loading, setLoading] = useState(false);
  const [contractorId, setContractorId] = useState("");
  const [skillGraph, setSkillGraph] = useState<SkillGraph | null>(null);
  const { toast } = useToast();

  const buildSkillGraph = async () => {
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
      const { data, error } = await supabase.functions.invoke("ai-contractor-skill-graph", {
        body: {
          contractorId,
          projectHistory: [],
          tradeExpertise: ["Kitchen", "Tile", "Drywall"],
          bids: [],
          ratings: []
        }
      });

      if (error) throw error;

      setSkillGraph(data);
      toast({
        title: "Skill Graph Created",
        description: "Contractor skill profile generated"
      });
    } catch (error) {
      console.error("Error building skill graph:", error);
      toast({
        title: "Error",
        description: "Failed to build skill graph",
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
          <GitBranch className="h-5 w-5" />
          Contractor Skill Graph
        </CardTitle>
        <CardDescription>
          AI-generated contractor expertise mapping
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Contractor ID</label>
          <Input
            value={contractorId}
            onChange={(e) => setContractorId(e.target.value)}
            placeholder="Enter contractor ID"
          />
        </div>

        <Button onClick={buildSkillGraph} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Build Skill Graph
        </Button>

        {skillGraph && (
          <div className="space-y-4 mt-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skillGraph.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Optimal Budgets</h3>
              <div className="flex flex-wrap gap-2">
                {skillGraph.optimal_budgets.map((budget, idx) => (
                  <span key={idx} className="px-3 py-1 bg-muted rounded-lg text-sm">
                    {budget}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Ideal Zip Codes</h3>
              <div className="flex flex-wrap gap-2">
                {skillGraph.ideal_zip_codes.map((zip, idx) => (
                  <span key={idx} className="px-3 py-1 bg-muted rounded-lg text-sm">
                    {zip}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-primary/5">
              <h3 className="font-semibold mb-2">AI Recommendations</h3>
              <ul className="space-y-1">
                {skillGraph.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3 } from "lucide-react";

interface ProPlusInsights {
  summary: string;
  recommended_project_types: string[];
  average_bid_position: number;
  win_rate: number;
  improvement_areas: string[];
  market_trends: string[];
}

export function ProPlusInsightsDashboard() {
  const [loading, setLoading] = useState(false);
  const [contractorId, setContractorId] = useState("");
  const [insights, setInsights] = useState<ProPlusInsights | null>(null);
  const { toast } = useToast();

  const generateInsights = async () => {
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
      const { data, error } = await supabase.functions.invoke("ai-proplus-insights", {
        body: {
          contractorId,
          projectHistory: [],
          bidHistory: [],
          ratings: [4.5, 4.8, 4.2],
          warrantyCaseHistory: []
        }
      });

      if (error) throw error;

      setInsights(data);
      toast({
        title: "Insights Generated",
        description: "Pro+ performance analysis complete"
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate insights",
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
          <BarChart3 className="h-5 w-5" />
          Pro+ Insights Dashboard
        </CardTitle>
        <CardDescription>
          AI-powered performance analytics for contractors
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

        <Button onClick={generateInsights} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Pro+ Insights
        </Button>

        {insights && (
          <div className="space-y-4 mt-6">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Performance Summary</h3>
              <p className="text-sm text-muted-foreground">{insights.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-3xl font-bold text-primary">{insights.win_rate}%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-3xl font-bold text-primary">{insights.average_bid_position}</div>
                <div className="text-sm text-muted-foreground">Avg Bid Position</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Recommended Project Types</h3>
              <div className="flex flex-wrap gap-2">
                {insights.recommended_project_types.map((type, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Areas for Improvement</h3>
              <ul className="space-y-1">
                {insights.improvement_areas.map((area, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {area}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 border rounded-lg bg-primary/5">
              <h3 className="font-semibold mb-2">Market Trends</h3>
              <ul className="space-y-1">
                {insights.market_trends.map((trend, idx) => (
                  <li key={idx} className="text-sm">• {trend}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

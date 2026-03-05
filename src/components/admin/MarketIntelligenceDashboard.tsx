import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";

interface MarketScore {
  opportunity_score: number;
  renovation_demand_score: number;
  housing_stock_age: number;
  median_home_value: number;
  renovation_volume_trend: string;
  contractor_competition_level: string;
  expansion_priority: number;
  market_analysis: {
    strengths: string[];
    opportunities: string[];
    challenges: string[];
  };
  recommendation: string;
}

export function MarketIntelligenceDashboard() {
  const [loading, setLoading] = useState(false);
  const [marketScore, setMarketScore] = useState<MarketScore | null>(null);
  const { toast } = useToast();

  const analyzeMarket = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-market-score", {
        body: {
          state: "NJ",
          metroArea: "New York Metro",
          county: "Bergen"
        }
      });

      if (error) throw error;

      setMarketScore(data);
      toast({
        title: "Market Analysis Complete",
        description: "Opportunity score calculated"
      });
    } catch (error) {
      console.error("Error analyzing market:", error);
      toast({
        title: "Error",
        description: "Failed to analyze market",
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
          Market Intelligence Dashboard
        </CardTitle>
        <CardDescription>
          AI-powered expansion recommendations
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button onClick={analyzeMarket} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Analyze Market (NJ - Bergen County)
        </Button>

        {marketScore && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">{marketScore.opportunity_score}</div>
                <div className="text-sm text-muted-foreground">Opportunity Score</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-primary">{marketScore.renovation_demand_score}</div>
                <div className="text-sm text-muted-foreground">Demand Score</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">#{marketScore.expansion_priority}</div>
                <div className="text-sm text-muted-foreground">Expansion Priority</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-lg font-bold">${(marketScore.median_home_value / 1000).toFixed(0)}k</div>
                <div className="text-sm text-muted-foreground">Median Home Value</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{marketScore.housing_stock_age} years</div>
                <div className="text-sm text-muted-foreground">Housing Stock Age</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-primary">Strengths</h4>
                <ul className="space-y-1 text-sm">
                  {marketScore.market_analysis.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-primary">Opportunities</h4>
                <ul className="space-y-1 text-sm">
                  {marketScore.market_analysis.opportunities.map((o, i) => (
                    <li key={i}>• {o}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-destructive">Challenges</h4>
                <ul className="space-y-1 text-sm">
                  {marketScore.market_analysis.challenges.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-primary/5">
              <h3 className="font-semibold mb-2">AI Recommendation</h3>
              <p className="text-sm">{marketScore.recommendation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

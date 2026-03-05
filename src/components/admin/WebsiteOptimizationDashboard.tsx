import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";

export function WebsiteOptimizationDashboard() {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const analyzeConversions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-conversion-optimizer', {
        body: { timeRange }
      });

      if (error) throw error;

      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `Conversion rate: ${data.conversion_rates?.intake_to_complete || 0}%`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
          Website Optimization Insights
        </CardTitle>
        <CardDescription>
          AI-powered page performance analysis and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Time Range</Label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={analyzeConversions} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Analyzing..." : "Analyze Conversion Funnel"}
        </Button>

        {analysis && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Overall Score</Label>
                <span className="text-2xl font-bold">{analysis.overall_score}/100</span>
              </div>
              <Progress value={analysis.overall_score} />
            </div>

            {analysis.critical_issues && analysis.critical_issues.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Critical Issues
                </Label>
                <div className="space-y-2">
                  {analysis.critical_issues.map((issue: string, idx: number) => (
                    <div key={idx} className="bg-destructive/10 p-2 rounded text-sm">
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-2">Recommendations</Label>
              <div className="space-y-2">
                {analysis.recommendations?.slice(0, 5).map((rec: any, idx: number) => (
                  <div key={idx} className="border rounded p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'outline'}>
                        {rec.priority} priority
                      </Badge>
                      <Badge variant="secondary">{rec.category}</Badge>
                    </div>
                    <p className="text-sm font-medium">{rec.suggestion}</p>
                    <p className="text-xs text-muted-foreground">
                      Expected impact: {rec.expected_impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {analysis.quick_wins && analysis.quick_wins.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Quick Wins
                </Label>
                <ul className="space-y-1 text-sm">
                  {analysis.quick_wins.map((win: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5" />
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.ai_opportunities && analysis.ai_opportunities.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2">AI Enhancement Opportunities</Label>
                <ul className="space-y-1 text-sm">
                  {analysis.ai_opportunities.map((opp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                      {opp}
                    </li>
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
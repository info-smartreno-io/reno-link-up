import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

export function WeeklyReport() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const { toast } = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-weekly-report');

      if (error) throw error;

      setReport(data);
      toast({
        title: "Report Generated",
        description: `Health Score: ${data.overall_health_score}/100`,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Weekly Performance Report
              </CardTitle>
              <CardDescription>
                AI-generated insights from the past 7 days
              </CardDescription>
            </div>
            <Button onClick={generateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardHeader>
        {report && (
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Overall Health Score</Label>
                <span className="text-2xl font-bold">{report.overall_health_score}/100</span>
              </div>
              <Progress value={report.overall_health_score} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-3">
                <div className="text-2xl font-bold">
                  {report.key_metrics?.homeowner_leads || 0}
                </div>
                <div className="text-xs text-muted-foreground">Homeowner Leads</div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-2xl font-bold">
                  {report.key_metrics?.contractor_leads || 0}
                </div>
                <div className="text-xs text-muted-foreground">Contractor Leads</div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-2xl font-bold">
                  {report.key_metrics?.conversion_rate || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Conversion Rate</div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="text-2xl font-bold">
                  {report.key_metrics?.content_quality || 0}
                </div>
                <div className="text-xs text-muted-foreground">Content Quality</div>
              </div>
            </div>

            {report.wins && report.wins.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Key Wins
                </Label>
                <ul className="space-y-1 text-sm">
                  {report.wins.map((win: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5" />
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.concerns && report.concerns.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Areas of Concern
                </Label>
                <ul className="space-y-1 text-sm">
                  {report.concerns.map((concern: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-600 mt-1.5" />
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.recommendations && report.recommendations.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Recommendations
                </Label>
                <div className="space-y-2">
                  {report.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="border rounded p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'outline'}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="secondary">{rec.category}</Badge>
                      </div>
                      <p className="text-sm font-medium">{rec.action}</p>
                      <p className="text-xs text-muted-foreground">
                        Expected impact: {rec.expected_impact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.next_week_forecast && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2">Next Week Forecast</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="text-xl font-bold">
                      {report.next_week_forecast.predicted_homeowner_leads || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Homeowner Leads</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xl font-bold">
                      {report.next_week_forecast.predicted_contractor_leads || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Contractor Leads</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xl font-bold">
                      {report.next_week_forecast.confidence || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

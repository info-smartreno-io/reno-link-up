import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export function AutoQAMonitor() {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [qaResults, setQaResults] = useState<any>(null);
  const { toast } = useToast();

  const runQACheck = async () => {
    if (!projectId) {
      toast({
        title: "Missing Project ID",
        description: "Please enter a project ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-auto-qa-monitor', {
        body: {
          projectId,
          estimate: { total: 50000, lineItems: [] },
          bids: [],
          timeline: [],
          messages: []
        }
      });

      if (error) throw error;

      setQaResults(data);
      toast({
        title: "QA Check Complete",
        description: `Found ${data.qa_issues?.length || 0} issues`,
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
        <CardTitle>Autonomous QA Monitor</CardTitle>
        <CardDescription>
          Automated quality assurance across estimates, bids, and timelines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Project ID</Label>
          <Input
            placeholder="Enter project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        </div>

        <Button 
          onClick={runQACheck} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>Running QA...</>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Run QA Check
            </>
          )}
        </Button>

        {qaResults && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">QA Results:</h3>
              <Badge variant={qaResults.requires_human_review ? "destructive" : "default"}>
                Confidence: {(qaResults.confidence_score * 100).toFixed(0)}%
              </Badge>
            </div>

            {qaResults.qa_issues && qaResults.qa_issues.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Issues Found</Label>
                {qaResults.qa_issues.map((issue: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{issue}</p>
                      {qaResults.proposed_fixes?.[idx] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fix: {qaResults.proposed_fixes[idx]}
                        </p>
                      )}
                    </div>
                    {qaResults.severity_levels?.[idx] && (
                      <Badge variant="outline" className="text-xs">
                        {qaResults.severity_levels[idx]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {qaResults.recommendations && qaResults.recommendations.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Recommendations</Label>
                <ul className="mt-2 space-y-1 text-sm">
                  {qaResults.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                      {rec}
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
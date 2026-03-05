import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface MatchOptimizerPanelProps {
  projectId?: string;
  scope?: any;
  budgetRange?: string;
  zip?: string;
  contractorPool?: any[];
}

export function MatchOptimizerPanel({ 
  projectId = '',
  scope = {},
  budgetRange = '',
  zip = '',
  contractorPool = []
}: MatchOptimizerPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [matches, setMatches] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-match-optimizer', {
        body: {
          projectId,
          scope,
          budgetRange,
          zip,
          contractorPool,
        },
      });

      if (error) throw error;

      setMatches(data);
      toast.success('Contractor matching complete');
    } catch (error) {
      console.error('Error optimizing matches:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to optimize matches');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              AI Contractor Match Optimization
            </CardTitle>
            <CardDescription>
              Rank contractors by fit quality to maximize conversion
            </CardDescription>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="gap-2"
          >
            {analyzing ? (
              <>Analyzing...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Optimize Matches (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {matches && (
        <CardContent className="space-y-6">
          {/* Recommendation Summary */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              Recommended Contractor Count
            </div>
            <div className="text-3xl font-bold">
              {matches.recommended_count || 3}
            </div>
            {matches.routing_strategy && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">{matches.routing_strategy}</p>
              </div>
            )}
          </div>

          {/* Ranked Contractors */}
          {matches.ranked_contractors && matches.ranked_contractors.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Contractor Rankings</div>
              <div className="grid gap-3">
                {matches.ranked_contractors.map((contractor: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">Contractor ID: {contractor.contractorId}</div>
                          <div className="text-sm text-muted-foreground mt-1">{contractor.fit_reason}</div>
                        </div>
                      </div>
                      <Badge variant={getScoreBadgeVariant(contractor.score)}>
                        {contractor.score}
                      </Badge>
                    </div>

                    {/* Strengths */}
                    {contractor.strengths && contractor.strengths.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-green-600 dark:text-green-400">Strengths:</div>
                        {contractor.strengths.map((strength: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{strength}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Concerns */}
                    {contractor.concerns && contractor.concerns.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Concerns:</div>
                        {contractor.concerns.map((concern: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{concern}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {matches.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{matches.reasoning}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              className="flex-1"
              onClick={() => toast.info('Apply contractor routing (demo)')}
            >
              Apply Routing
            </Button>
            <Button 
              variant="outline"
              onClick={() => toast.info('Manual override (demo)')}
            >
              Manual Override
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

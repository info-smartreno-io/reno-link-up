import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  MapPin,
  DollarSign,
  Wrench
} from "lucide-react";
import { toast } from "sonner";

interface ContractorAnalyzerPanelProps {
  contractorId?: string;
  pastBids?: any[];
  winRate?: number;
  projectOutcomes?: any[];
  warrantyClaims?: any[];
  responseTimes?: number[];
  ratingHistory?: number[];
  trade?: string;
}

export function ContractorAnalyzerPanel({ 
  contractorId = '', 
  pastBids = [], 
  winRate = 0, 
  projectOutcomes = [], 
  warrantyClaims = [], 
  responseTimes = [], 
  ratingHistory = [], 
  trade = 'General Contractor' 
}: ContractorAnalyzerPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-contractor-analyzer', {
        body: {
          contractorId,
          pastBids,
          winRate,
          projectOutcomes,
          warrantyClaims,
          responseTimes,
          ratingHistory,
          trade,
        },
      });

      if (error) throw error;

      setAnalysis(data);
      toast.success('Contractor performance analyzed');
    } catch (error) {
      console.error('Error analyzing contractor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze contractor');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Contractor Performance Analysis
            </CardTitle>
            <CardDescription>
              Evaluate contractor performance and network optimization
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
                Analyze Contractor Performance (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {analysis && (
        <CardContent className="space-y-6">
          {/* Performance Score */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Overall Performance Score
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(analysis.performance_score)}`}>
              {analysis.performance_score}/100
            </div>
            <Progress value={analysis.performance_score} className="mt-3 h-2" />
          </div>

          {/* Strengths */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Strengths
            </div>
            <div className="grid gap-2">
              {analysis.strengths?.map((strength: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                Areas for Improvement
              </div>
              <div className="grid gap-2">
                {analysis.weaknesses.map((weakness: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{weakness}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Flags */}
          {analysis.risk_flags && analysis.risk_flags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Risk Flags
              </div>
              <div className="grid gap-2">
                {analysis.risk_flags.map((flag: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Matches */}
          {analysis.recommended_matches && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 font-medium">
                <Target className="h-4 w-4" />
                Recommended Matches
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {analysis.recommended_matches.project_types && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Wrench className="h-3 w-3" />
                      Best Project Types
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommended_matches.project_types.map((type: string, index: number) => (
                        <Badge key={index} variant="secondary">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommended_matches.trades && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Wrench className="h-3 w-3" />
                      Focus Trades
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommended_matches.trades.map((t: string, index: number) => (
                        <Badge key={index} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommended_matches.budget_ranges && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      Budget Ranges
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommended_matches.budget_ranges.map((range: string, index: number) => (
                        <Badge key={index} variant="outline">{range}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommended_matches.geographic_focus && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Geographic Focus
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommended_matches.geographic_focus.map((area: string, index: number) => (
                        <Badge key={index} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Improvement Checklist */}
          {analysis.improvement_areas && analysis.improvement_areas.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Action Items</div>
              <div className="grid gap-2">
                {analysis.improvement_areas.map((item: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="mt-0.5">
                      <div className="h-4 w-4 rounded border-2 border-primary" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Shield
} from "lucide-react";
import { toast } from "sonner";

interface RiskPredictionPanelProps {
  projectId?: string;
  timeline?: any[];
  messages?: any[];
  contractorStats?: any;
  materialDelays?: any[];
  walkthroughNotes?: any;
  recentUploads?: any[];
}

export function RiskPredictionPanel({ 
  projectId = '', 
  timeline = [], 
  messages = [],
  contractorStats = {},
  materialDelays = [],
  walkthroughNotes = {},
  recentUploads = []
}: RiskPredictionPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-risk-predictor', {
        body: {
          projectId,
          timeline,
          messages,
          contractorStats,
          materialDelays,
          walkthroughNotes,
          recentUploads,
        },
      });

      if (error) throw error;

      setRiskAnalysis(data);
      toast.success('Risk analysis complete');
    } catch (error) {
      console.error('Error analyzing risk:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze project risk');
    } finally {
      setAnalyzing(false);
    }
  };

  const getAlertColor = (level: string) => {
    if (level === 'green') return 'text-green-600';
    if (level === 'yellow') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlertVariant = (level: string): "default" | "secondary" | "destructive" => {
    if (level === 'green') return 'secondary';
    if (level === 'yellow') return 'default';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              AI Risk Prediction
            </CardTitle>
            <CardDescription>
              Analyze project data to identify risks and recommend mitigation strategies
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
                Analyze Project Risk (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {riskAnalysis && (
        <CardContent className="space-y-6">
          {/* Risk Score */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Risk Score
            </div>
            <div className={`text-4xl font-bold ${getAlertColor(riskAnalysis.alert_level)}`}>
              {riskAnalysis.risk_score}/100
            </div>
            <Progress 
              value={riskAnalysis.risk_score} 
              className="mt-3 h-2"
            />
            <div className="mt-3">
              <Badge variant={getAlertVariant(riskAnalysis.alert_level)}>
                {riskAnalysis.alert_level.toUpperCase()} ALERT
              </Badge>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Risk Factors
            </div>
            <div className="grid gap-2">
              {riskAnalysis.risk_factors?.map((factor: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm capitalize">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Likelihood of Delay */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Likelihood of Delay</div>
            <Badge variant="outline" className="capitalize">
              {riskAnalysis.likelihood_of_delay}
            </Badge>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Recommended Actions
            </div>
            <div className="grid gap-2">
              {riskAnalysis.recommended_actions?.map((action: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning */}
          {riskAnalysis.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{riskAnalysis.reasoning}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              className="flex-1"
              onClick={() => toast.info('Action plan applied (demo)')}
            >
              Apply Action Plan
            </Button>
            <Button 
              variant="outline"
              onClick={() => toast.info('Alert sent (demo)')}
            >
              Send Alert to PM
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Calendar, 
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ForecastingPanelProps {
  projectId?: string;
  scope?: any;
  contractorPerformance?: any;
  subSchedules?: any[];
  materialLeadTimes?: any[];
  pastSimilarProjects?: any[];
}

export function ForecastingPanel({ 
  projectId = '', 
  scope = {},
  contractorPerformance = {},
  subSchedules = [],
  materialLeadTimes = [],
  pastSimilarProjects = []
}: ForecastingPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [forecast, setForecast] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-forecasting-engine', {
        body: {
          projectId,
          scope,
          contractorPerformance,
          subSchedules,
          materialLeadTimes,
          pastSimilarProjects,
        },
      });

      if (error) throw error;

      setForecast(data);
      toast.success('Forecast generated');
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate forecast');
    } finally {
      setAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Project Forecasting
            </CardTitle>
            <CardDescription>
              Predict completion dates, budget variance, and timeline pressure points
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
                Generate Forecast (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {forecast && (
        <CardContent className="space-y-6">
          {/* Predicted Completion Date */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              Predicted Completion Date
            </div>
            <div className="text-3xl font-bold">
              {new Date(forecast.predicted_completion_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className={`text-sm font-semibold ${getConfidenceColor(forecast.confidence)}`}>
                  {Math.round(forecast.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Budget Variance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                Budget Variance
              </div>
              <div className="text-2xl font-bold">
                {forecast.budget_variance}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Forecast Confidence
              </div>
              <div className={`text-2xl font-bold ${getConfidenceColor(forecast.confidence)}`}>
                {Math.round(forecast.confidence * 100)}%
              </div>
            </div>
          </div>

          {/* Timeline Pressure Points */}
          {forecast.timeline_pressure_points && forecast.timeline_pressure_points.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Timeline Pressure Points
              </div>
              <div className="grid gap-2">
                {forecast.timeline_pressure_points.map((point: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {forecast.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{forecast.reasoning}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              className="flex-1"
              onClick={() => toast.info('Forecast shared with team (demo)')}
            >
              Share Forecast
            </Button>
            <Button 
              variant="outline"
              onClick={() => toast.info('Schedule adjusted (demo)')}
            >
              Adjust Schedule
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

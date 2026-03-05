import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ConversionAssistantPanelProps {
  homeownerId?: string;
  projectId?: string;
  sessionBehavior?: any;
}

export function ConversionAssistantPanel({ 
  homeownerId = '',
  projectId = '',
  sessionBehavior = {}
}: ConversionAssistantPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [conversion, setConversion] = useState<any>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-conversion-optimizer', {
        body: {
          homeownerId,
          projectId,
          sessionBehavior,
        },
      });

      if (error) throw error;

      setConversion(data);
      toast.success('Conversion analysis complete');
    } catch (error) {
      console.error('Error analyzing conversion:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze conversion');
    } finally {
      setAnalyzing(false);
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              AI Booking Conversion Optimizer
            </CardTitle>
            <CardDescription>
              Increase homeowner booking rates with AI-driven tactics
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
                Analyze Conversion (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {conversion && (
        <CardContent className="space-y-6">
          {/* Conversion Probability */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Probability
            </div>
            <div className={`text-3xl font-bold ${getProbabilityColor(conversion.conversion_probability)}`}>
              {Math.round((conversion.conversion_probability || 0) * 100)}%
            </div>
          </div>

          {/* Recommended Steps */}
          {conversion.recommended_steps && conversion.recommended_steps.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Recommended Steps</div>
              <div className="grid gap-2">
                {conversion.recommended_steps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messaging Strategy */}
          {conversion.messaging_strategy && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-sm font-medium mb-2 text-purple-900 dark:text-purple-100">
                Messaging Strategy
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">{conversion.messaging_strategy}</p>
            </div>
          )}

          {/* Friction Points */}
          {conversion.friction_points && conversion.friction_points.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Friction Points Detected</div>
              {conversion.friction_points.map((point: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{point}</span>
                </div>
              ))}
            </div>
          )}

          {/* Next Best Action */}
          {conversion.next_best_action && (
            <div className="p-4 border-2 border-primary rounded-lg">
              <div className="text-sm font-medium mb-2 text-primary">Next Best Action</div>
              <p className="text-sm font-semibold">{conversion.next_best_action}</p>
            </div>
          )}

          {/* Recommended Message */}
          {conversion.recommended_message && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Recommended Message to Homeowner</div>
              <p className="text-sm text-muted-foreground italic">"{conversion.recommended_message}"</p>
            </div>
          )}

          {/* Reasoning */}
          {conversion.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{conversion.reasoning}</p>
            </div>
          )}

          {/* Action Button */}
          <Button 
            className="w-full"
            onClick={() => toast.info('Send message to homeowner (demo)')}
          >
            Send Message
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface FinanceOptionsPanelProps {
  projectId?: string;
  budget?: string;
  projectType?: string;
  homeownerProfile?: any;
  location?: string;
}

export function FinanceOptionsPanel({ 
  projectId = '',
  budget = '',
  projectType = '',
  homeownerProfile = {},
  location = ''
}: FinanceOptionsPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [finance, setFinance] = useState<any>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-finance-recommender', {
        body: {
          projectId,
          budget,
          projectType,
          homeownerProfile,
          location,
        },
      });

      if (error) throw error;

      setFinance(data);
      toast.success('Financing recommendations generated');
    } catch (error) {
      console.error('Error generating finance recommendations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate recommendations');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              AI Financing Recommendations
            </CardTitle>
            <CardDescription>
              Personalized financing options to increase conversion
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
                Generate Options (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {finance && (
        <CardContent className="space-y-6">
          {/* Best Match */}
          {finance.best_match && (
            <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Best Match for This Project
              </div>
              <div className="text-2xl font-bold">
                {finance.best_match}
              </div>
            </div>
          )}

          {/* Recommended Options */}
          {finance.recommended_options && finance.recommended_options.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Financing Options</div>
              <div className="grid gap-3">
                {finance.recommended_options.map((option: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{option.type}</div>
                        <div className="text-sm text-muted-foreground mt-1">{option.reason}</div>
                      </div>
                      <Badge variant="outline">
                        {option.estimated_rate}
                      </Badge>
                    </div>

                    {/* Pros */}
                    {option.pros && option.pros.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-green-600 dark:text-green-400">Pros:</div>
                        {option.pros.map((pro: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{pro}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cons */}
                    {option.cons && option.cons.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400">Cons:</div>
                        {option.cons.map((con: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <XCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{con}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversion Language */}
          {finance.conversion_language && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Recommended Messaging</div>
              <p className="text-sm text-muted-foreground">{finance.conversion_language}</p>
            </div>
          )}

          {/* Reasoning */}
          {finance.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{finance.reasoning}</p>
            </div>
          )}

          {/* Action Button */}
          <Button 
            className="w-full"
            onClick={() => toast.info('Present options to homeowner (demo)')}
          >
            Present to Homeowner
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

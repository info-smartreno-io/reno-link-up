import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface UpsellPanelProps {
  projectId?: string;
  scope?: any;
  homeownerProfile?: any;
  budgetRange?: string;
  uploadedPhotos?: any[];
}

export function UpsellPanel({ 
  projectId = '', 
  scope = {},
  homeownerProfile = {},
  budgetRange = '',
  uploadedPhotos = []
}: UpsellPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [upsells, setUpsells] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-upsell-engine', {
        body: {
          projectId,
          scope,
          homeownerProfile,
          budgetRange,
          uploadedPhotos,
        },
      });

      if (error) throw error;

      setUpsells(data);
      toast.success('Upsell analysis complete');
    } catch (error) {
      console.error('Error analyzing upsells:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze upsells');
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
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Upsell Opportunities
            </CardTitle>
            <CardDescription>
              Identify revenue-increasing services and upgrades
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
                Analyze Upsells (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {upsells && (
        <CardContent className="space-y-6">
          {/* Total Potential Increase */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              Total Potential Revenue Increase
            </div>
            <div className="text-3xl font-bold">
              ${upsells.total_potential_increase?.toLocaleString() || 0}
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className="text-sm font-semibold text-green-600">
                  {Math.round((upsells.confidence || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Upsell Opportunities */}
          {upsells.upsell_opportunities && upsells.upsell_opportunities.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Recommended Upsells</div>
              <div className="grid gap-3">
                {upsells.upsell_opportunities.map((upsell: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{upsell.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{upsell.reason}</div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        +${upsell.estimated_increase}
                      </Badge>
                    </div>
                    
                    {upsell.recommended_language && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Suggested Messaging:
                        </div>
                        <div className="text-sm">{upsell.recommended_language}</div>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast.info('Add to estimate (demo)')}
                      className="w-full"
                    >
                      Add to Estimate
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {upsells.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{upsells.reasoning}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

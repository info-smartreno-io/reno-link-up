import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PricingOptimizationPanelProps {
  estimate?: any;
  marketData?: any;
  contractorBidHistory?: any[];
  projectType?: string;
  zipCode?: string;
}

export function PricingOptimizationPanel({ 
  estimate = {},
  marketData = {},
  contractorBidHistory = [],
  projectType = '',
  zipCode = ''
}: PricingOptimizationPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [pricing, setPricing] = useState<any>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-margin-pricing-engine', {
        body: {
          estimate,
          marketData,
          contractorBidHistory,
          projectType,
          zipCode,
        },
      });

      if (error) throw error;

      setPricing(data);
      toast.success('Pricing analysis complete');
    } catch (error) {
      console.error('Error analyzing pricing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze pricing');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return 'text-red-600';
    if (risk === 'medium') return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'high') return <AlertTriangle className="h-4 w-4" />;
    if (risk === 'medium') return <AlertCircle className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Pricing & Margin Optimization
            </CardTitle>
            <CardDescription>
              Analyze pricing competitiveness and optimize margins
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
                Analyze Pricing (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {pricing && (
        <CardContent className="space-y-6">
          {/* Pricing Adjustment */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              Recommended Pricing Adjustment
            </div>
            <div className="text-3xl font-bold">
              {pricing.pricing_adjustment}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getRiskIcon(pricing.risk_of_underpricing)}
                <span className="text-sm font-medium text-muted-foreground">Underpricing Risk</span>
              </div>
              <div className={`text-2xl font-bold capitalize ${getRiskColor(pricing.risk_of_underpricing)}`}>
                {pricing.risk_of_underpricing}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getRiskIcon(pricing.risk_of_overpricing)}
                <span className="text-sm font-medium text-muted-foreground">Overpricing Risk</span>
              </div>
              <div className={`text-2xl font-bold capitalize ${getRiskColor(pricing.risk_of_overpricing)}`}>
                {pricing.risk_of_overpricing}
              </div>
            </div>
          </div>

          {/* Margin Optimization */}
          {pricing.margin_optimization && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="text-sm font-medium">Margin Optimization</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Suggested Service Fee</div>
                  <div className="text-lg font-semibold">{pricing.margin_optimization.suggested_fee}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Expected Gross Profit</div>
                  <div className="text-lg font-semibold">
                    ${pricing.margin_optimization.expected_gross_profit?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Market Insights */}
          {pricing.market_insights && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                Market Insights
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">{pricing.market_insights}</p>
            </div>
          )}

          {/* Line Item Flags */}
          {pricing.line_item_flags && pricing.line_item_flags.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Line Item Alerts</div>
              {pricing.line_item_flags.map((flag: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-yellow-900 dark:text-yellow-100">{flag}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reasoning */}
          {pricing.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{pricing.reasoning}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

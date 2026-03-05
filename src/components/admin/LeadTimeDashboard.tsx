import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Package,
  AlertTriangle,
  Clock,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface LeadTimeDashboardProps {
  projectId?: string;
  materials?: any[];
  vendorData?: any;
}

export function LeadTimeDashboard({ 
  projectId = '', 
  materials = [],
  vendorData = {}
}: LeadTimeDashboardProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-materials-leadtime-intelligence', {
        body: {
          projectId,
          materials,
          vendorData,
        },
      });

      if (error) throw error;

      setAnalysis(data);
      toast.success('Lead time analysis complete');
    } catch (error) {
      console.error('Error analyzing lead times:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze lead times');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'low') return 'text-green-600';
    if (severity === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" => {
    if (severity === 'low') return 'secondary';
    if (severity === 'medium') return 'default';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Materials & Lead-Time Intelligence
            </CardTitle>
            <CardDescription>
              Predict supply chain delays and recommend schedule adjustments
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
                Analyze Lead Times (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {analysis && (
        <CardContent className="space-y-6">
          {/* Material Risks */}
          {analysis.material_risks && analysis.material_risks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Material Delay Risks
              </div>
              <div className="grid gap-3">
                {analysis.material_risks.map((risk: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h4 className="font-semibold">{risk.material}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{risk.reason}</p>
                        </div>
                      </div>
                      <Badge variant={getSeverityVariant(risk.severity)}>
                        {risk.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-medium ${getSeverityColor(risk.severity)}`}>
                        Expected Delay: {risk.expected_delay}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Schedule Adjustments */}
          {analysis.recommended_schedule_adjustments && analysis.recommended_schedule_adjustments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Recommended Schedule Adjustments
              </div>
              <div className="grid gap-2">
                {analysis.recommended_schedule_adjustments.map((adjustment: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{adjustment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              className="flex-1"
              onClick={() => toast.info('Timeline adjustments applied (demo)')}
            >
              Apply Timeline Adjustments
            </Button>
            <Button 
              variant="outline"
              onClick={() => toast.info('Vendor notified (demo)')}
            >
              Notify Vendor
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, AlertCircle } from "lucide-react";

interface TimelineAdjustmentPanelProps {
  projectId: string;
  currentTimeline: any[];
  materialDelays: any[];
  subReschedules: any[];
  inspectionUpdates: any[];
}

export function TimelineAdjustmentPanel({
  projectId,
  currentTimeline,
  materialDelays,
  subReschedules,
  inspectionUpdates
}: TimelineAdjustmentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [adjustment, setAdjustment] = useState<any>(null);
  const { toast } = useToast();

  const generateAdjustment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-timeline-adjuster", {
        body: {
          projectId,
          currentTimeline,
          materialDelays,
          subReschedules,
          inspectionUpdates
        }
      });

      if (error) throw error;

      setAdjustment(data);

      toast({
        title: "Timeline Adjustment Generated",
        description: "AI has suggested timeline updates based on delays and reschedules."
      });
    } catch (error) {
      console.error("Error generating timeline adjustment:", error);
      toast({
        title: "Error",
        description: "Failed to generate timeline adjustment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              AI Timeline Adjustment
            </CardTitle>
            <CardDescription>
              Automatically adjust project timeline based on delays and reschedules
            </CardDescription>
          </div>
          <Button onClick={generateAdjustment} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Timeline
          </Button>
        </div>
      </CardHeader>

      {adjustment && (
        <CardContent className="space-y-6">
          {/* Impact Summary */}
          <div>
            <h3 className="font-semibold mb-2">Impact Summary</h3>
            <p className="text-muted-foreground">{adjustment.impact_summary}</p>
          </div>

          {/* Critical Path Changes */}
          {adjustment.critical_path_changes && adjustment.critical_path_changes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Critical Path Changes
              </h3>
              <ul className="space-y-1">
                {adjustment.critical_path_changes.map((change: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning */}
          {adjustment.reasoning && (
            <div>
              <h3 className="font-semibold mb-2">AI Reasoning</h3>
              <p className="text-sm text-muted-foreground">{adjustment.reasoning}</p>
            </div>
          )}

          {/* Updated Timeline */}
          {adjustment.updated_timeline && adjustment.updated_timeline.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Suggested Timeline</h3>
              <div className="space-y-2">
                {adjustment.updated_timeline.map((milestone: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded-lg">
                    <span className="text-sm font-medium">{milestone.phase || milestone.name}</span>
                    <Badge variant="outline">{milestone.date || milestone.estimated_date}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="default">Apply to Timeline</Button>
            <Button variant="outline">Review Manually</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

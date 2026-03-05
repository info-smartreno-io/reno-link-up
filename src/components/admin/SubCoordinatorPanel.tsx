import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, AlertTriangle, Send } from "lucide-react";

interface SubCoordinatorPanelProps {
  projectId: string;
  subSchedules: any[];
  timeline: any[];
  trade?: string;
  delayContext?: any;
}

export function SubCoordinatorPanel({
  projectId,
  subSchedules,
  timeline,
  trade,
  delayContext
}: SubCoordinatorPanelProps) {
  const [loading, setLoading] = useState(false);
  const [syncReport, setSyncReport] = useState<any>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [alternativeMessage, setAlternativeMessage] = useState("");
  const { toast } = useToast();

  const generateSyncReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sub-sync-agent", {
        body: {
          projectId,
          subSchedules,
          timeline,
          trade: trade || "General",
          delayContext: delayContext || {}
        }
      });

      if (error) throw error;

      setSyncReport(data);
      setConfirmMessage(data.recommended_sub_messages?.confirm || "");
      setAlternativeMessage(data.recommended_sub_messages?.alternative || "");

      toast({
        title: "Sub Sync Report Generated",
        description: "AI has analyzed subcontractor schedules and risks."
      });
    } catch (error) {
      console.error("Error generating sub sync report:", error);
      toast({
        title: "Error",
        description: "Failed to generate sub sync report",
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
              <Users className="h-5 w-5" />
              Subcontractor Sync Agent
            </CardTitle>
            <CardDescription>
              Coordinate subcontractors and identify scheduling conflicts
            </CardDescription>
          </div>
          <Button onClick={generateSyncReport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Schedule
          </Button>
        </div>
      </CardHeader>

      {syncReport && (
        <CardContent className="space-y-6">
          {/* Schedule Risks */}
          {syncReport.schedule_risks && syncReport.schedule_risks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Schedule Risks
              </h3>
              <ul className="space-y-1">
                {syncReport.schedule_risks.map((risk: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {syncReport.next_steps && syncReport.next_steps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ul className="space-y-1">
                {syncReport.next_steps.map((step: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span>•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Messages */}
          {syncReport.recommended_sub_messages && (
            <div className="space-y-4">
              <h3 className="font-semibold">AI-Generated Messages</h3>
              
              {syncReport.recommended_sub_messages.confirm && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Confirmation Message (Editable)
                  </label>
                  <Textarea
                    value={confirmMessage}
                    onChange={(e) => setConfirmMessage(e.target.value)}
                    rows={3}
                    className="mb-2"
                  />
                  <Button size="sm" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send Confirmation
                  </Button>
                </div>
              )}

              {syncReport.recommended_sub_messages.alternative && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Alternative Request (Editable)
                  </label>
                  <Textarea
                    value={alternativeMessage}
                    onChange={(e) => setAlternativeMessage(e.target.value)}
                    rows={3}
                    className="mb-2"
                  />
                  <Button size="sm" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Request Alternatives
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

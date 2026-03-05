import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle2, Send } from "lucide-react";

interface CoordinatorDashboardProps {
  projectId: string;
  timeline: any[];
  messages: any[];
  contractorUpdates: any[];
  subSchedules: any[];
  materialStatus: any[];
  recentPhotos: any[];
  last24hActivity: any[];
}

export function CoordinatorDashboard({
  projectId,
  timeline,
  messages,
  contractorUpdates,
  subSchedules,
  materialStatus,
  recentPhotos,
  last24hActivity
}: CoordinatorDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [homeownerMessage, setHomeownerMessage] = useState("");
  const [contractorMessage, setContractorMessage] = useState("");
  const { toast } = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coordinator-engine", {
        body: {
          projectId,
          timeline,
          messages,
          contractorUpdates,
          subSchedules,
          materialStatus,
          recentPhotos,
          last24hActivity
        }
      });

      if (error) throw error;

      setReport(data);
      setHomeownerMessage(data.auto_drafts?.homeowner_message || "");
      setContractorMessage(data.auto_drafts?.contractor_message || "");

      toast({
        title: "Coordination Report Generated",
        description: "AI has analyzed the project and generated recommendations."
      });
    } catch (error) {
      console.error("Error generating coordinator report:", error);
      toast({
        title: "Error",
        description: "Failed to generate coordination report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              AI Autonomous Coordinator
            </CardTitle>
            <CardDescription>
              Daily project coordination report and automated task management
            </CardDescription>
          </div>
          <Button onClick={generateReport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
        </div>
      </CardHeader>

      {report && (
        <CardContent className="space-y-6">
          {/* Status Summary */}
          <div>
            <h3 className="font-semibold mb-2">Project Status</h3>
            <p className="text-muted-foreground">{report.status_summary}</p>
            <Badge variant={getPriorityColor(report.priority_level)} className="mt-2">
              {report.priority_level?.toUpperCase() || "NORMAL"} Priority
            </Badge>
          </div>

          {/* Risks Detected */}
          {report.risks_detected && report.risks_detected.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Risks Detected
              </h3>
              <ul className="space-y-1">
                {report.risks_detected.map((risk: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {report.recommended_actions && report.recommended_actions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Recommended Actions</h3>
              <ul className="space-y-2">
                {report.recommended_actions.map((action: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Auto-Drafted Messages */}
          {report.auto_drafts && (
            <div className="space-y-4">
              <h3 className="font-semibold">AI-Generated Messages</h3>
              
              {report.auto_drafts.homeowner_message && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Homeowner Update (Editable)
                  </label>
                  <Textarea
                    value={homeownerMessage}
                    onChange={(e) => setHomeownerMessage(e.target.value)}
                    rows={4}
                    className="mb-2"
                  />
                  <Button size="sm" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send to Homeowner
                  </Button>
                </div>
              )}

              {report.auto_drafts.contractor_message && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Contractor Message (Editable)
                  </label>
                  <Textarea
                    value={contractorMessage}
                    onChange={(e) => setContractorMessage(e.target.value)}
                    rows={4}
                    className="mb-2"
                  />
                  <Button size="sm" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send to Contractor
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="default">Apply Action Plan</Button>
            <Button variant="outline">Escalate to Manager</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface EscalationCenterProps {
  projectId: string;
  riskScore?: number;
  contractorResponsiveness?: any;
  subResponsiveness?: any;
  materialDelays?: any[];
  inspections?: any[];
  messages?: any[];
}

export function EscalationCenter({
  projectId,
  riskScore,
  contractorResponsiveness,
  subResponsiveness,
  materialDelays,
  inspections,
  messages
}: EscalationCenterProps) {
  const [loading, setLoading] = useState(false);
  const [escalation, setEscalation] = useState<any>(null);
  const { toast } = useToast();

  const checkEscalation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-issue-escalation", {
        body: {
          projectId,
          riskScore: riskScore || 0,
          contractorResponsiveness: contractorResponsiveness || {},
          subResponsiveness: subResponsiveness || {},
          materialDelays: materialDelays || [],
          inspections: inspections || [],
          messages: messages || []
        }
      });

      if (error) throw error;

      setEscalation(data);

      toast({
        title: "Escalation Check Complete",
        description: data.escalation_required 
          ? "Human intervention is recommended" 
          : "No escalation needed at this time"
      });
    } catch (error) {
      console.error("Error checking escalation:", error);
      toast({
        title: "Error",
        description: "Failed to check escalation status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getPriorityIcon = (required: boolean) => {
    if (required) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              AI Issue Escalation Center
            </CardTitle>
            <CardDescription>
              Automatically detect issues requiring human intervention
            </CardDescription>
          </div>
          <Button onClick={checkEscalation} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Check Status
          </Button>
        </div>
      </CardHeader>

      {escalation && (
        <CardContent className="space-y-6">
          {/* Escalation Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getPriorityIcon(escalation.escalation_required)}
              <div>
                <p className="font-semibold">
                  {escalation.escalation_required ? "Escalation Required" : "No Escalation Needed"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {escalation.escalation_required 
                    ? "Human intervention recommended" 
                    : "Project is on track"}
                </p>
              </div>
            </div>
            <Badge variant={getPriorityColor(escalation.priority)}>
              {escalation.priority?.toUpperCase() || "NORMAL"}
            </Badge>
          </div>

          {/* Recommended Contact */}
          {escalation.escalation_required && escalation.recommended_contact && (
            <div>
              <h3 className="font-semibold mb-2">Recommended Contact</h3>
              <p className="text-sm text-muted-foreground">{escalation.recommended_contact}</p>
            </div>
          )}

          {/* Reason */}
          {escalation.reason && (
            <div>
              <h3 className="font-semibold mb-2">Reason for Escalation</h3>
              <p className="text-sm text-muted-foreground">{escalation.reason}</p>
            </div>
          )}

          {/* Action Items */}
          {escalation.action_items && escalation.action_items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Required Actions</h3>
              <ul className="space-y-2">
                {escalation.action_items.map((action: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {escalation.escalation_required && (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="destructive">Contact Manager</Button>
              <Button variant="outline">Create Incident Report</Button>
              <Button variant="ghost">Dismiss</Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

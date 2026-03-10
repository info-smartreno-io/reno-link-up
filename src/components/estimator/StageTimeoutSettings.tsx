import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StageTimeout {
  id: string;
  stage_status: string;
  timeout_hours: number;
  warning_hours: number;
  notification_enabled: boolean;
}

const stageNames: Record<string, string> = {
  new_lead: "New Lead",
  call_24h: "24hr Call",
  walkthrough: "Walkthrough",
  scope_sent: "Scope Sent",
  scope_adjustment: "Scope Adjustment",
  architectural_design: "Architectural/Design",
  bid_room: "Bid Room",
  smart_bid_3: "3SmartBid",
  bid_accepted: "Bid Accepted",
};

export function StageTimeoutSettings() {
  const [timeouts, setTimeouts] = useState<StageTimeout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeouts();
  }, []);

  const fetchTimeouts = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_stage_timeouts")
        .select("*")
        .order("stage_status");

      if (error) throw error;
      setTimeouts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load timeout settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTimeout = (id: string, field: keyof StageTimeout, value: any) => {
    setTimeouts(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = timeouts.map(timeout =>
        supabase
          .from("lead_stage_timeouts")
          .update({
            timeout_hours: timeout.timeout_hours,
            warning_hours: timeout.warning_hours,
            notification_enabled: timeout.notification_enabled,
          })
          .eq("id", timeout.id)
      );

      await Promise.all(updates);

      toast({
        title: "Settings saved",
        description: "Stage timeout configurations have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Stage Timeout Settings
            </CardTitle>
            <CardDescription>
              Configure automatic alerts when leads stay in stages too long
            </CardDescription>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Automated Monitoring Active
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  The system checks for stale leads every hour and sends email notifications to all Construction Agents and admins.
                </p>
              </div>
            </div>
          </div>

          {timeouts.map((timeout) => (
            <div
              key={timeout.id}
              className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">
                    {stageNames[timeout.stage_status] || timeout.stage_status}
                  </h3>
                  <Badge variant={timeout.notification_enabled ? "default" : "secondary"}>
                    {timeout.notification_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Notifications</span>
                  <Switch
                    checked={timeout.notification_enabled}
                    onCheckedChange={(checked) =>
                      updateTimeout(timeout.id, "notification_enabled", checked)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Warning After (hours)
                  </label>
                  <Input
                    type="number"
                    value={timeout.warning_hours}
                    onChange={(e) =>
                      updateTimeout(timeout.id, "warning_hours", parseInt(e.target.value))
                    }
                    min={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send warning notification
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Overdue After (hours)
                  </label>
                  <Input
                    type="number"
                    value={timeout.timeout_hours}
                    onChange={(e) =>
                      updateTimeout(timeout.id, "timeout_hours", parseInt(e.target.value))
                    }
                    min={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mark as overdue
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Leads will be flagged as approaching deadline after{" "}
                <span className="font-semibold">{timeout.warning_hours}h</span> and
                marked overdue after{" "}
                <span className="font-semibold">{timeout.timeout_hours}h</span> in this
                stage.
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

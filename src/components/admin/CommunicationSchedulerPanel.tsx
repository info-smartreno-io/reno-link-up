import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

export function CommunicationSchedulerPanel() {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [event, setEvent] = useState("");
  const [recipient, setRecipient] = useState("");
  const [scheduledComm, setScheduledComm] = useState<any>(null);
  const { toast } = useToast();

  const scheduleCommunication = async () => {
    if (!projectId || !event || !recipient) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-communication-scheduler', {
        body: {
          projectId,
          event,
          recipient,
          context: { source: "admin_portal" }
        }
      });

      if (error) throw error;

      setScheduledComm(data);
      toast({
        title: "Communication Scheduled",
        description: `Message drafted for ${recipient}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Scheduler</CardTitle>
        <CardDescription>
          AI-powered cross-portal communication automation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Project ID</Label>
          <Input
            placeholder="Enter project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Event Type</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
              <SelectItem value="payment_due">Payment Due</SelectItem>
              <SelectItem value="delay_notification">Delay Notification</SelectItem>
              <SelectItem value="milestone_completed">Milestone Completed</SelectItem>
              <SelectItem value="material_delay">Material Delay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Recipient</Label>
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homeowner">Homeowner</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="subcontractor">Subcontractor</SelectItem>
              <SelectItem value="pm">Project Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={scheduleCommunication} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>Scheduling...</>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Schedule Communication
            </>
          )}
        </Button>

        {scheduledComm && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Scheduled Communication:</h3>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Message</Label>
                <Textarea 
                  value={scheduledComm.message} 
                  readOnly 
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Importance</Label>
                  <p className="capitalize">{scheduledComm.importance}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tone</Label>
                  <p className="capitalize">{scheduledComm.tone}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
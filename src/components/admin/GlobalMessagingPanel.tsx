import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, 
  MessageSquare,
  Send
} from "lucide-react";
import { toast } from "sonner";

interface GlobalMessagingPanelProps {
  projectId?: string;
  context?: any;
}

export function GlobalMessagingPanel({ 
  projectId = '', 
  context = {}
}: GlobalMessagingPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [eventType, setEventType] = useState('');
  const [recipient, setRecipient] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [editedMessage, setEditedMessage] = useState('');
  const [messageData, setMessageData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!eventType || !recipient) {
      toast.error('Please select event type and recipient');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-global-messaging-agent', {
        body: {
          projectId,
          eventType,
          context,
          recipient,
        },
      });

      if (error) throw error;

      setMessageData(data);
      setGeneratedMessage(data.message);
      setEditedMessage(data.message);
      toast.success('Message generated');
    } catch (error) {
      console.error('Error generating message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate message');
    } finally {
      setGenerating(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      update: "secondary",
      important: "default",
      urgent: "destructive"
    };
    return variants[severity] || "default";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Global Messaging Agent
            </CardTitle>
            <CardDescription>
              Generate professional messages for homeowners, contractors, and PMs
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Message Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delay">Delay Notification</SelectItem>
                <SelectItem value="milestone">Milestone Complete</SelectItem>
                <SelectItem value="material_issue">Material Issue</SelectItem>
                <SelectItem value="walkthrough_complete">Walkthrough Complete</SelectItem>
                <SelectItem value="change_order">Change Order</SelectItem>
                <SelectItem value="timeline_update">Timeline Update</SelectItem>
                <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
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
                <SelectItem value="pm">Project Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={generating || !eventType || !recipient}
          className="w-full gap-2"
        >
          {generating ? (
            <>Generating...</>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Message (AI)
            </>
          )}
        </Button>

        {/* Generated Message */}
        {generatedMessage && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Message (Editable)</Label>
                {messageData?.severity && (
                  <Badge variant={getSeverityBadge(messageData.severity)}>
                    {messageData.severity.toUpperCase()}
                  </Badge>
                )}
              </div>
              <Textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Suggested Follow-up */}
            {messageData?.suggested_follow_up && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Suggested Follow-up</div>
                <p className="text-sm text-muted-foreground">{messageData.suggested_follow_up}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                className="flex-1 gap-2"
                onClick={() => toast.success('Message sent (demo)')}
              >
                <Send className="h-4 w-4" />
                Send via AI
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(editedMessage);
                  toast.success('Message copied to clipboard');
                }}
              >
                Copy Message
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

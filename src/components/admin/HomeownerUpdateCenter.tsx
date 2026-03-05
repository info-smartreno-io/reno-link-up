import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Send } from "lucide-react";

interface HomeownerUpdateCenterProps {
  projectId: string;
  timeline: any[];
  recentChanges: any[];
  milestones: any[];
  delays: any[];
}

export function HomeownerUpdateCenter({
  projectId,
  timeline,
  recentChanges,
  milestones,
  delays
}: HomeownerUpdateCenterProps) {
  const [loading, setLoading] = useState(false);
  const [update, setUpdate] = useState<any>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const generateUpdate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-update-scheduler", {
        body: {
          projectId,
          timeline,
          recentChanges,
          milestones,
          delays
        }
      });

      if (error) throw error;

      setUpdate(data);
      setMessage(data.scheduled_update?.message || "");

      toast({
        title: "Homeowner Update Generated",
        description: "AI has drafted a professional update for the homeowner."
      });
    } catch (error) {
      console.error("Error generating homeowner update:", error);
      toast({
        title: "Error",
        description: "Failed to generate homeowner update",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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
              <Mail className="h-5 w-5" />
              Homeowner Update Scheduler
            </CardTitle>
            <CardDescription>
              AI-generated professional homeowner communications
            </CardDescription>
          </div>
          <Button onClick={generateUpdate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Update
          </Button>
        </div>
      </CardHeader>

      {update && (
        <CardContent className="space-y-6">
          {/* Schedule Info */}
          {update.scheduled_update && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Scheduled Send Date</p>
                <p className="text-sm text-muted-foreground">{update.scheduled_update.send_on}</p>
              </div>
              <Badge variant={getUrgencyColor(update.urgency_level)}>
                {update.urgency_level?.toUpperCase() || "NORMAL"} Urgency
              </Badge>
            </div>
          )}

          {/* Message Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Message Preview (Editable)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="mb-2"
              placeholder="AI-generated homeowner update will appear here..."
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="default">
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
            <Button variant="outline">Schedule for Later</Button>
            <Button variant="ghost">Save as Draft</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

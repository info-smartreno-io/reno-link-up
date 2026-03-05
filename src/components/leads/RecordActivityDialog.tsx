import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRecordActivity, ActivityType, ACTIVITY_CONFIG } from "@/hooks/useLeadActivities";
import { Plus, Loader2 } from "lucide-react";

interface RecordActivityDialogProps {
  leadId: string;
  leadName: string;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

export function RecordActivityDialog({
  leadId,
  leadName,
  onSuccess,
  triggerButton,
}: RecordActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const recordActivity = useRecordActivity();

  const handleSubmit = async () => {
    try {
      await recordActivity.mutateAsync({
        leadId,
        activityType,
        description: description.trim() || undefined,
      });

      toast({
        title: "Activity recorded",
        description: `${ACTIVITY_CONFIG[activityType].label} logged for ${leadName}`,
      });

      setOpen(false);
      setDescription("");
      setActivityType("call");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error recording activity:", error);
      toast({
        title: "Error",
        description: "Failed to record activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Activity - {leadName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="activity-type">Activity Type</Label>
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">📞 Call</SelectItem>
                <SelectItem value="email">✉️ Email</SelectItem>
                <SelectItem value="meeting">👥 Meeting</SelectItem>
                <SelectItem value="site_visit">📍 Site Visit</SelectItem>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="proposal_sent">📄 Proposal Sent</SelectItem>
                <SelectItem value="other">⚡ Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this activity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={recordActivity.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={recordActivity.isPending}>
              {recordActivity.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Activity"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

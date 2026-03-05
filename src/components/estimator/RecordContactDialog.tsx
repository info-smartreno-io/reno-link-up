import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRecordActivity } from "@/hooks/useLeadActivities";
import { Phone, MessageSquare } from "lucide-react";

interface RecordContactDialogProps {
  leadId: string;
  leadName: string;
  onSuccess?: () => void;
}

export function RecordContactDialog({ leadId, leadName, onSuccess }: RecordContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const recordActivity = useRecordActivity();

  const handleRecordContact = async () => {
    setLoading(true);
    try {
      // Get current lead data
      const { data: currentLead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      // Update last contact date and increment contact count
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          last_contact_date: new Date().toISOString(),
          contact_count: ((currentLead as any)?.contact_count || 0) + 1,
        } as any)
        .eq("id", leadId);

      if (updateError) throw updateError;

      // Record the activity in lead_activities
      await recordActivity.mutateAsync({
        leadId,
        activityType: "contact_recorded",
        description: notes.trim() || "Contact recorded",
      });

      // Add note to stage history if provided (legacy support)
      if (notes.trim()) {
        const { error: historyError } = await supabase
          .from("lead_stage_history")
          .insert({
            lead_id: leadId,
            to_status: "contact_recorded",
            notes: notes.trim(),
          });

        if (historyError) console.error("Failed to add note:", historyError);
      }

      toast({
        title: "Contact recorded",
        description: `Updated contact information for ${leadName}. Lead score will be recalculated.`,
      });

      setOpen(false);
      setNotes("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error recording contact:", error);
      toast({
        title: "Error",
        description: "Failed to record contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Phone className="h-4 w-4 mr-2" />
          Record Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Contact - {leadName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Contact Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this contact... (e.g., Discussed timeline, Sent additional photos, etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-xs text-blue-900 dark:text-blue-100">
                Recording contact will update the last contact timestamp and improve the lead's response time score.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRecordContact} disabled={loading}>
              {loading ? "Recording..." : "Record Contact"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

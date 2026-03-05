import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LeadStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  currentStatus: string;
  newStatus: string;
  onSuccess: () => void;
}

const COMMON_REASONS = {
  on_hold: [
    "Client requested delay",
    "Waiting for permits",
    "Budget constraints - needs time",
    "Seasonal timing",
    "Personal circumstances",
    "Other",
  ],
  lost: [
    "Chose another contractor",
    "Budget too high",
    "Timeline doesn't work",
    "Project cancelled",
    "No response from client",
    "Outside service area",
    "Other",
  ],
};

export function LeadStatusChangeDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  currentStatus,
  newStatus,
  onSuccess,
}: LeadStatusChangeDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const requiresReason = newStatus === "on_hold" || newStatus === "lost";
  const reasons = newStatus === "on_hold" ? COMMON_REASONS.on_hold : COMMON_REASONS.lost;

  const handleSave = async () => {
    if (requiresReason && !reason) {
      toast({
        title: "Reason Required",
        description: `Please select a reason for moving this lead to ${newStatus.replace("_", " ")}.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          status: newStatus,
          status_change_reason: reason || null,
          status_change_notes: notes || null,
        })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `${leadName} has been moved to ${newStatus.replace("_", " ")}.`,
      });

      onOpenChange(false);
      setReason("");
      setNotes("");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Lead Status</DialogTitle>
          <DialogDescription>
            Moving "{leadName}" from{" "}
            <span className="font-semibold">{currentStatus.replace("_", " ")}</span> to{" "}
            <span className="font-semibold">{newStatus.replace("_", " ")}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {requiresReason && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please provide a reason for this status change. This helps track why leads don't convert.
              </AlertDescription>
            </Alert>
          )}

          {requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes {!requiresReason && "(Optional)"}
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Change
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

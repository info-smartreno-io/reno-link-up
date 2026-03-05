import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Calendar, Check } from "lucide-react";
import { format } from "date-fns";

interface SubDateConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidResponseId: string;
  proposedStart: string | null;
  proposedEnd: string | null;
  onSuccess: () => void;
}

export function SubDateConfirmationDialog({
  open,
  onOpenChange,
  bidResponseId,
  proposedStart,
  proposedEnd,
  onSuccess,
}: SubDateConfirmationDialogProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"confirm" | "propose">("confirm");
  const [altStartDate, setAltStartDate] = useState("");
  const [altEndDate, setAltEndDate] = useState("");
  const [reason, setReason] = useState("");

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("sub_bid_responses")
        .update({
          date_confirmed_at: new Date().toISOString(),
          date_confirmed_by: userData.user.id,
        })
        .eq("id", bidResponseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awarded-bids"] });
      toast.success("Dates confirmed! Added to your calendar.");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to confirm dates");
    },
  });

  const proposeMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Update with proposed dates
      const { error } = await supabase
        .from("sub_bid_responses")
        .update({
          scheduled_start_date: altStartDate,
          scheduled_end_date: altEndDate || null,
        })
        .eq("id", bidResponseId);

      if (error) throw error;

      // Create notification for coordinator
      await supabase.from("subcontractor_notifications").insert({
        subcontractor_id: userData.user.id, // This should be coordinator ID in production
        type: "date_proposed",
        title: "Alternative Dates Proposed",
        message: `Subcontractor proposed new dates: ${format(new Date(altStartDate), "MMM d")} - ${altEndDate ? format(new Date(altEndDate), "MMM d") : "TBD"}. Reason: ${reason}`,
        related_id: bidResponseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awarded-bids"] });
      toast.success("Alternative dates proposed");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to propose dates");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Confirm Schedule
          </DialogTitle>
          <DialogDescription>
            Confirm the proposed dates or propose an alternative.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Proposed Dates */}
          {proposedStart && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-1">Proposed Schedule</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(proposedStart), "MMMM d, yyyy")}
                {proposedEnd && ` - ${format(new Date(proposedEnd), "MMMM d, yyyy")}`}
              </p>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "confirm" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("confirm")}
              className="flex-1"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept Dates
            </Button>
            <Button
              variant={mode === "propose" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("propose")}
              className="flex-1"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Propose Alternative
            </Button>
          </div>

          {/* Confirm Mode */}
          {mode === "confirm" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                By confirming, these dates will be added to your calendar and the
                project coordinator will be notified.
              </p>
              <Button
                className="w-full"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Dates"
                )}
              </Button>
            </div>
          )}

          {/* Propose Mode */}
          {mode === "propose" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="alt-start">Start Date *</Label>
                  <Input
                    id="alt-start"
                    type="date"
                    value={altStartDate}
                    onChange={(e) => setAltStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alt-end">End Date</Label>
                  <Input
                    id="alt-end"
                    type="date"
                    value={altEndDate}
                    onChange={(e) => setAltEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why the proposed dates don't work..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => proposeMutation.mutate()}
                disabled={!altStartDate || proposeMutation.isPending}
              >
                {proposeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Propose Alternative Dates"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Loader2, DollarSign, Clock, FileText } from "lucide-react";

interface SubBidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  trade: string;
  onSuccess: () => void;
}

export function SubBidSubmissionDialog({
  open,
  onOpenChange,
  packageId,
  trade,
  onSuccess,
}: SubBidSubmissionDialogProps) {
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedWeeks, setEstimatedWeeks] = useState("");
  const [notes, setNotes] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("sub_bid_responses").insert({
        package_id: packageId,
        subcontractor_id: userData.user.id,
        bid_amount: parseFloat(bidAmount),
        timeline_weeks: estimatedWeeks ? parseInt(estimatedWeeks) : null,
        notes,
        status: "submitted",
      } as any);

      if (error) throw error;

      // Update invitation status
      await supabase
        .from("sub_bid_invitations")
        .update({ status: "bid_submitted" })
        .eq("package_id", packageId)
        .eq("subcontractor_id", userData.user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-bid-packages"] });
      queryClient.invalidateQueries({ queryKey: ["sub-bid-responses"] });
      toast.success("Bid submitted successfully!");
      setBidAmount("");
      setEstimatedWeeks("");
      setNotes("");
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to submit bid");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Bid for {trade}</DialogTitle>
          <DialogDescription>
            Enter your bid details. Make sure to review the scope before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bid-amount" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Bid Amount *
            </Label>
            <Input
              id="bid-amount"
              type="number"
              placeholder="50000"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Estimated Timeline (weeks)
            </Label>
            <Input
              id="timeline"
              type="number"
              placeholder="4"
              value={estimatedWeeks}
              onChange={(e) => setEstimatedWeeks(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Notes / Clarifications
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special conditions, clarifications, or inclusions/exclusions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!bidAmount || submitMutation.isPending}
              className="flex-1"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit Bid"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

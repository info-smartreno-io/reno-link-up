import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  PauseCircle, 
  XCircle, 
  AlertTriangle,
  Lock,
  PartyPopper
} from "lucide-react";

const OUTCOME_CONFIG = {
  sold: { 
    label: "Sold", 
    icon: CheckCircle2, 
    color: "bg-green-500",
    description: "Triggers contract + financing flow"
  },
  on_hold: { 
    label: "On Hold", 
    icon: PauseCircle, 
    color: "bg-amber-500",
    description: "Pauses automation"
  },
  cancelled: { 
    label: "Cancelled", 
    icon: XCircle, 
    color: "bg-red-500",
    description: "Requires reason code"
  },
  lost: { 
    label: "Lost", 
    icon: XCircle, 
    color: "bg-gray-500",
    description: "Requires reason code"
  },
};

const CANCEL_REASONS = [
  "Budget constraints",
  "Changed mind",
  "Went with competitor",
  "Project postponed indefinitely",
  "Property sold",
  "Financing denied",
  "Other",
];

const LOST_REASONS = [
  "Price too high",
  "Competitor won",
  "Scope mismatch",
  "Timeline issues",
  "Communication issues",
  "No response",
  "Other",
];

interface Props {
  leadId: string;
  currentOutcome: string | null;
  isReadonly?: boolean;
}

export function SaleOutcomePanel({ leadId, currentOutcome, isReadonly = false }: Props) {
  const queryClient = useQueryClient();
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const updateOutcomeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOutcome) throw new Error("No outcome selected");

      const updateData: Record<string, unknown> = {
        sale_outcome: selectedOutcome,
        sale_outcome_reason: reason || null,
      };

      if (selectedOutcome === 'sold') {
        updateData.sold_at = new Date().toISOString();
        updateData.estimator_readonly = true;
        updateData.stage = 'sold';
      } else if (selectedOutcome === 'on_hold') {
        updateData.stage = 'on_hold';
      } else {
        updateData.estimator_readonly = true;
        updateData.stage = selectedOutcome;
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      queryClient.invalidateQueries({ queryKey: ["estimator-leads-table"] });
      setShowOutcomeDialog(false);
      setSelectedOutcome(null);
      setReason("");
      setNotes("");
      
      if (selectedOutcome === 'sold') {
        toast.success("Congratulations! Sale recorded - contract flow triggered");
      } else {
        toast.success("Outcome recorded");
      }
    },
    onError: (error) => {
      toast.error("Failed to update outcome");
      console.error(error);
    },
  });

  const needsReason = selectedOutcome === 'cancelled' || selectedOutcome === 'lost';
  const reasons = selectedOutcome === 'cancelled' ? CANCEL_REASONS : LOST_REASONS;

  if (currentOutcome && currentOutcome !== 'on_hold') {
    const config = OUTCOME_CONFIG[currentOutcome as keyof typeof OUTCOME_CONFIG];
    const Icon = config?.icon || CheckCircle2;

    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className={`inline-flex p-3 rounded-full mb-3 ${
              currentOutcome === 'sold' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
            }`}>
              <Icon className={`h-8 w-8 ${
                currentOutcome === 'sold' ? 'text-green-600' : 'text-muted-foreground'
              }`} />
            </div>
            <h3 className="font-semibold mb-1">
              {currentOutcome === 'sold' ? 'Project Sold!' : `Project ${config?.label || currentOutcome}`}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {currentOutcome === 'sold' 
                ? 'Ownership transferred downstream. You have read-only access.'
                : 'This lead has been closed.'}
            </p>
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Read-only
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sale Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          {currentOutcome === 'on_hold' && (
            <div className="mb-4 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <PauseCircle className="h-4 w-4" />
                <span className="font-medium">Currently On Hold</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                Automation is paused. Update when ready to proceed.
              </p>
            </div>
          )}

          {!isReadonly && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="flex-col h-auto py-4 border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-800 dark:hover:bg-green-950"
                onClick={() => {
                  setSelectedOutcome('sold');
                  setShowOutcomeDialog(true);
                }}
              >
                <CheckCircle2 className="h-6 w-6 mb-1 text-green-600" />
                <span className="text-sm font-medium">Sold</span>
              </Button>
              <Button
                variant="outline"
                className="flex-col h-auto py-4 border-amber-200 hover:bg-amber-50 hover:border-amber-300 dark:border-amber-800 dark:hover:bg-amber-950"
                onClick={() => {
                  setSelectedOutcome('on_hold');
                  setShowOutcomeDialog(true);
                }}
              >
                <PauseCircle className="h-6 w-6 mb-1 text-amber-600" />
                <span className="text-sm font-medium">On Hold</span>
              </Button>
              <Button
                variant="outline"
                className="flex-col h-auto py-4 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-950"
                onClick={() => {
                  setSelectedOutcome('cancelled');
                  setShowOutcomeDialog(true);
                }}
              >
                <XCircle className="h-6 w-6 mb-1 text-red-600" />
                <span className="text-sm font-medium">Cancelled/Lost</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOutcome === 'sold' && <PartyPopper className="h-5 w-5 text-green-500" />}
              {selectedOutcome && OUTCOME_CONFIG[selectedOutcome as keyof typeof OUTCOME_CONFIG]?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedOutcome === 'sold' 
                ? 'This will trigger the contract + financing flow and lock your access to edit.'
                : selectedOutcome === 'on_hold'
                ? 'Automation will be paused until you update the status.'
                : 'Please provide a reason for this outcome.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {needsReason && (
              <div>
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reasons.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            {selectedOutcome === 'sold' && (
              <div className="text-sm bg-green-50 dark:bg-green-950/30 p-3 rounded-md text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 inline-block mr-1.5" />
                After marking as sold, ownership transfers to the PM team.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOutcomeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateOutcomeMutation.mutate()}
              disabled={updateOutcomeMutation.isPending || (needsReason && !reason)}
              className={selectedOutcome === 'sold' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {selectedOutcome === 'sold' ? 'Mark as Sold' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
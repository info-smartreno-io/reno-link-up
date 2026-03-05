import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface SubAppointmentConfirmationProps {
  appointment: any;
  onAction?: () => void;
}

export function SubAppointmentConfirmation({
  appointment,
  onAction,
}: SubAppointmentConfirmationProps) {
  const [proposeDialogOpen, setProposeDialogOpen] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [subNote, setSubNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('appointments-accept', {
        body: {
          appointment_id: appointment.id,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined,
      });

      if (error) throw error;

      toast({
        title: "Time accepted",
        description: "The appointment has been confirmed.",
      });

      onAction?.();
    } catch (error: any) {
      console.error("Error accepting appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to accept appointment",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposedDate || !proposedTime) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide both date and time",
      });
      return;
    }

    setLoading(true);

    try {
      const proposedStart = `${proposedDate}T${proposedTime}:00`;
      const proposedEnd = new Date(new Date(proposedStart).getTime() + 60 * 60 * 1000).toISOString();

      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('appointments-propose', {
        body: {
          appointment_id: appointment.id,
          proposed_start: proposedStart,
          proposed_end: proposedEnd,
          sub_note: subNote || null,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined,
      });

      if (error) throw error;

      toast({
        title: "Alternative time proposed",
        description: "Your counter-proposal has been sent to the project manager.",
      });

      setProposeDialogOpen(false);
      setProposedDate("");
      setProposedTime("");
      setSubNote("");
      onAction?.();
    } catch (error: any) {
      console.error("Error proposing time:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to propose time",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestedStart = new Date(appointment.requested_start);

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Requested Time</span>
        </div>
        <div className="text-lg font-semibold">
          {format(requestedStart, "EEEE, MMMM d, yyyy")}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{format(requestedStart, "h:mm a")}</span>
        </div>
      </div>

      {appointment.homeowner_note && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Homeowner Note:</div>
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {appointment.homeowner_note}
          </div>
        </div>
      )}

      {appointment.pm_note && (
        <div className="space-y-1">
          <div className="text-sm font-medium">PM Note:</div>
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {appointment.pm_note}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Accept Time
        </Button>
        <Button
          onClick={() => setProposeDialogOpen(true)}
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Suggest Different Time
        </Button>
      </div>

      <Dialog open={proposeDialogOpen} onOpenChange={setProposeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest Different Time</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePropose} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proposed-date">Proposed Date</Label>
              <Input
                id="proposed-date"
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposed-time">Proposed Time</Label>
              <Input
                id="proposed-time"
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-note">Note (optional)</Label>
              <Textarea
                id="sub-note"
                placeholder="Explain why this time works better..."
                value={subNote}
                onChange={(e) => setSubNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProposeDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Proposal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

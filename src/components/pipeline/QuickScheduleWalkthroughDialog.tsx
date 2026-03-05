import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { PipelineLead } from "./PipelineLeadCard";

interface QuickScheduleWalkthroughDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: PipelineLead | null;
  onScheduled: () => void;
}

export function QuickScheduleWalkthroughDialog({
  open,
  onOpenChange,
  lead,
  onScheduled,
}: QuickScheduleWalkthroughDialogProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!lead || !selectedDate || !time) return;

    setScheduling(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledDateTime = setMinutes(setHours(selectedDate, hours), minutes);

      // Generate walkthrough number
      const walkthroughNumber = `WK-${Date.now().toString(36).toUpperCase()}`;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create walkthrough record
      const { error: walkthroughError } = await supabase
        .from("walkthroughs")
        .insert({
          walkthrough_number: walkthroughNumber,
          lead_id: lead.id,
          user_id: lead.estimator_id || user.id,
          client_name: lead.name,
          project_name: lead.project_type,
          address: lead.location,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: time,
          status: "scheduled",
          notes: notes || null,
        });

      if (walkthroughError) throw walkthroughError;

      // Update lead with walkthrough scheduled time
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          walkthrough_scheduled_at: scheduledDateTime.toISOString(),
          status: "walkthrough",
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      toast({
        title: "Walkthrough scheduled",
        description: `Visit scheduled for ${format(scheduledDateTime, "MMM d, yyyy 'at' h:mm a")}`,
      });

      onScheduled();
      onOpenChange(false);
      
      // Reset form
      setSelectedDate(addDays(new Date(), 1));
      setTime("10:00");
      setNotes("");
    } catch (error: any) {
      console.error("Error scheduling walkthrough:", error);
      toast({
        title: "Error",
        description: "Failed to schedule walkthrough. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScheduling(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule Home Visit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{lead.name}</p>
            <p className="text-sm text-muted-foreground">{lead.location}</p>
            <p className="text-sm text-muted-foreground">{lead.project_type}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="time" className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes" className="mb-2 block">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={4}
                />
              </div>

              {selectedDate && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")} at {time}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSchedule}
              disabled={!selectedDate || !time || scheduling}
            >
              {scheduling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Schedule Visit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

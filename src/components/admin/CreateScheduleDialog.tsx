import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedTime?: string;
}

export function CreateScheduleDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  selectedTime 
}: CreateScheduleDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    contractor_id: "",
    event_time: selectedTime || "",
  });

  // Fetch team members (contractors)
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-contractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !formData.contractor_id || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('contractor_schedule')
        .insert({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          contractor_id: formData.contractor_id,
          event_date: format(selectedDate, 'yyyy-MM-dd'),
          event_time: formData.event_time || null,
        });

      if (error) throw error;

      toast.success("Schedule event created successfully");
      queryClient.invalidateQueries({ queryKey: ['all-team-schedules'] });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        location: "",
        contractor_id: "",
        event_time: "",
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error("Failed to create schedule event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Schedule Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              value={selectedDate ? format(selectedDate, 'PPP') : ''}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractor">Team Member *</Label>
            <Select
              value={formData.contractor_id}
              onValueChange={(value) => setFormData({ ...formData, contractor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || 'Unnamed User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Meeting, Site Visit, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time (Optional)</Label>
            <Input
              id="time"
              type="time"
              value={formData.event_time}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Address or location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes or details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

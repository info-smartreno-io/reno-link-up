import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PMMeetingsPanelProps {
  projectId: string;
}

interface Meeting {
  id: string;
  meeting_type: string;
  meeting_title: string;
  scheduled_date: string | null;
  completed_at: string | null;
  notes: string | null;
}

const meetingTypes = [
  { value: 'pre_start', label: 'Pre-Start Site Meeting' },
  { value: 'weekly_pm', label: 'Weekly PM Meeting' },
  { value: 'coordination', label: 'Coordination Meeting' },
  { value: 'final_walk', label: 'Final Walk-Through' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'vendor_meeting', label: 'Vendor Meeting' }
];

export function PMMeetingsPanel({ projectId }: PMMeetingsPanelProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    meeting_type: '',
    meeting_title: '',
    scheduled_date: '',
    notes: ''
  });

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['pm-meetings', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_meetings')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as Meeting[];
    }
  });

  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('project_meetings')
        .insert({
          project_id: projectId,
          meeting_type: newMeeting.meeting_type,
          meeting_title: newMeeting.meeting_title,
          scheduled_date: newMeeting.scheduled_date || null,
          notes: newMeeting.notes || null,
          created_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-meetings', projectId] });
      setIsDialogOpen(false);
      setNewMeeting({ meeting_type: '', meeting_title: '', scheduled_date: '', notes: '' });
      toast.success('Meeting scheduled');
    },
    onError: () => {
      toast.error('Failed to schedule meeting');
    }
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const { error } = await supabase
        .from('project_meetings')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', meetingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-meetings', projectId] });
      toast.success('Meeting marked complete');
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Field Meetings & PM Touchpoints</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select
                    value={newMeeting.meeting_type}
                    onValueChange={(value) => setNewMeeting(prev => ({ ...prev, meeting_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newMeeting.meeting_title}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, meeting_title: e.target.value }))}
                    placeholder="Meeting title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newMeeting.scheduled_date}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newMeeting.notes}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Meeting notes..."
                  />
                </div>
                <Button 
                  onClick={() => createMeetingMutation.mutate()}
                  disabled={!newMeeting.meeting_type || !newMeeting.meeting_title}
                  className="w-full"
                >
                  Schedule Meeting
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {meetings && meetings.length > 0 ? (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const isCompleted = !!meeting.completed_at;
              const typeLabel = meetingTypes.find(t => t.value === meeting.meeting_type)?.label || meeting.meeting_type;

              return (
                <div
                  key={meeting.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    isCompleted ? 'bg-muted/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {meeting.meeting_title}
                      </p>
                      <p className="text-xs text-muted-foreground">{typeLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {meeting.scheduled_date 
                        ? format(new Date(meeting.scheduled_date), 'MM/dd')
                        : 'TBD'
                      }
                    </span>
                    {meeting.notes && (
                      <Badge variant="outline" className="text-xs">
                        {meeting.notes.substring(0, 20)}...
                      </Badge>
                    )}
                    {!isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markCompleteMutation.mutate(meeting.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No meetings scheduled yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
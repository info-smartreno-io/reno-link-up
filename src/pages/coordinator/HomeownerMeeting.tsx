import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, Video, Phone, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  client_name: string;
  project_type: string;
  location: string;
  status: string;
}

interface MeetingNote {
  id: string;
  project_id: string;
  meeting_date: string;
  meeting_type: string;
  attendees: string[];
  notes: string;
  action_items: string[];
  completed: boolean;
  created_at: string;
}

const MEETING_TYPES = [
  "Initial Kickoff",
  "Design Review",
  "Material Selections",
  "Progress Update",
  "Final Walkthrough"
];

const CHECKLIST_ITEMS = [
  "Project scope reviewed",
  "Budget confirmed",
  "Timeline expectations set",
  "Communication preferences established",
  "Contact information verified",
  "Design preferences discussed",
  "Material selections scheduled",
  "Permit requirements explained",
  "Payment schedule reviewed",
  "Change order process explained"
];

export default function HomeownerMeeting() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [meetingDate, setMeetingDate] = useState<Date>();
  const [meetingType, setMeetingType] = useState("");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchMeetings();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const { data, error } = await supabase
        .from("contractor_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("homeowner_meetings")
        .select("*")
        .eq("project_id", projectId)
        .order("meeting_date", { ascending: false });

      if (error && error.code !== "PGRST116") throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const handleSaveMeeting = async () => {
    if (!meetingDate || !meetingType) {
      toast({
        title: "Missing Information",
        description: "Please select a meeting date and type.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("homeowner_meetings").insert({
        project_id: projectId,
        meeting_date: format(meetingDate, "yyyy-MM-dd"),
        meeting_type: meetingType,
        attendees: attendees.split(",").map(a => a.trim()).filter(a => a),
        notes,
        action_items: actionItems.split("\n").filter(item => item.trim()),
        completed: false,
      });

      if (error) throw error;

      toast({
        title: "Meeting Saved",
        description: "Homeowner meeting details have been saved successfully.",
      });

      setMeetingDate(undefined);
      setMeetingType("");
      setAttendees("");
      setNotes("");
      setActionItems("");
      fetchMeetings();
    } catch (error: any) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <BackButton />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Homeowner Meeting</h1>
          <p className="text-muted-foreground">
            {project?.client_name} - {project?.project_type}
          </p>
          <Badge className="mt-2">{project?.status?.replace(/_/g, " ")}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Schedule New Meeting
                </CardTitle>
                <CardDescription>
                  Document homeowner meetings and track action items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meeting Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !meetingDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {meetingDate ? format(meetingDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={meetingDate}
                          onSelect={setMeetingDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Meeting Type</Label>
                    <select
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Select type...</option>
                      {MEETING_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Attendees (comma separated)</Label>
                  <Input
                    placeholder="John Doe, Jane Smith"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meeting Notes</Label>
                  <Textarea
                    placeholder="Discussion points, decisions made, homeowner preferences..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Action Items (one per line)</Label>
                  <Textarea
                    placeholder="Schedule material selections&#10;Send permit application&#10;Order custom cabinets"
                    value={actionItems}
                    onChange={(e) => setActionItems(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSaveMeeting} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Meeting
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meeting History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {meetings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No meetings recorded yet
                  </p>
                ) : (
                  meetings.map(meeting => (
                    <div key={meeting.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{meeting.meeting_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(meeting.meeting_date), "PPP")}
                          </span>
                        </div>
                        {meeting.completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      {meeting.attendees.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {meeting.attendees.join(", ")}
                        </div>
                      )}
                      {meeting.notes && (
                        <p className="text-sm">{meeting.notes}</p>
                      )}
                      {meeting.action_items.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Action Items:</p>
                          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                            {meeting.action_items.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kickoff Checklist</CardTitle>
                <CardDescription>Track discussion topics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {CHECKLIST_ITEMS.map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <Checkbox
                      id={item}
                      checked={checklist[item] || false}
                      onCheckedChange={() => toggleChecklistItem(item)}
                    />
                    <label
                      htmlFor={item}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Video className="h-4 w-4" />
                  Schedule Video Call
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Phone className="h-4 w-4" />
                  Call Homeowner
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Send Calendar Invite
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

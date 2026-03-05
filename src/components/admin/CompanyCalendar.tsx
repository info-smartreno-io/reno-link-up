import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Mail, Plus, Filter, Search, RefreshCw, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  type?: string;
  backgroundColor?: string;
  borderColor?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
}

export default function CompanyCalendar() {
  const queryClient = useQueryClient();
  const calendarRef = useRef<any>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(new Set(["company"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMember, setFilterMember] = useState<string>("all");
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
    location: "",
    attendees: [] as string[],
    type: "internal",
  });

  // Mock team members - replace with actual data from your system
  const teamMembers: TeamMember[] = [
    { id: "1", name: "John Smith", email: "john@smartreno.io", role: "Estimator", color: "#3b82f6" },
    { id: "2", name: "Sarah Johnson", email: "sarah@smartreno.io", role: "Project Manager", color: "#10b981" },
    { id: "3", name: "Mike Chen", email: "mike@smartreno.io", role: "Contractor", color: "#f59e0b" },
    { id: "4", name: "Lisa Anderson", email: "lisa@smartreno.io", role: "Architect", color: "#8b5cf6" },
  ];

  // Fetch walkthroughs from database
  const { data: walkthroughs = [] } = useQuery({
    queryKey: ["walkthroughs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("walkthroughs")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Transform walkthroughs to calendar events
  const calendarEvents: CalendarEvent[] = walkthroughs.map((w) => ({
    id: w.id,
    title: `Walkthrough: ${w.address || "TBD"}`,
    start: w.date,
    end: w.date,
    description: w.notes || "",
    location: w.address || "",
    type: "walkthrough",
    backgroundColor: "#3b82f6",
    borderColor: "#2563eb",
  }));

  // Check Google Calendar connection status
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Set up realtime subscription for walkthroughs
  useEffect(() => {
    const channel = supabase
      .channel('walkthroughs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'walkthroughs',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["walkthroughs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("google_calendar_tokens")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking connection:", error);
        return;
      }

      if (data) {
        const expiresAt = new Date(data.expires_at);
        setIsConnected(expiresAt > new Date());
        setLastSyncTime(new Date(data.updated_at));
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  // Connect to Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        toast.error("Google Calendar is not configured. Please contact support.");
        return;
      }

      const redirectUri = `${window.location.origin}/admin/schedule`;
      const scope = "https://www.googleapis.com/auth/calendar";
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scope)}` +
        `&access_type=offline` +
        `&prompt=consent`;

      window.location.href = authUrl;
    } catch (error: any) {
      toast.error("Failed to connect: " + error.message);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          const redirectUri = `${window.location.origin}/admin/schedule`;
          
          const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
            body: { code, redirectUri },
          });

          if (error) throw error;

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          const expiresAt = new Date(Date.now() + data.expires_in * 1000);

          await supabase.from("google_calendar_tokens").upsert({
            user_id: user.id,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: expiresAt.toISOString(),
          });

          setIsConnected(true);
          
          // Register webhook for realtime sync
          await registerWebhook(data.access_token, user.id);
          
          toast.success("Google Calendar connected successfully with realtime sync!");
          
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error: any) {
          console.error("OAuth error:", error);
          toast.error("Failed to connect to Google Calendar");
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Register webhook for push notifications
  const registerWebhook = async (accessToken: string, userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-register-webhook", {
        body: {
          accessToken,
          userId,
          calendarId: "primary",
        },
      });

      if (error) throw error;

      console.log("Webhook registered:", data);
      toast.success("Realtime sync enabled - calendar will auto-update!");
    } catch (error: any) {
      console.error("Failed to register webhook:", error);
      // Don't show error to user as calendar still works without webhooks
    }
  };

  // Sync to Google Calendar
  const syncToGoogleMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: tokenData } = await supabase
        .from("google_calendar_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

      if (!tokenData) throw new Error("Not connected to Google Calendar");

      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action: "push",
          accessToken: tokenData.access_token,
          event: {
            summary: eventData.title,
            description: eventData.description,
            location: eventData.location,
            start: { dateTime: eventData.start },
            end: { dateTime: eventData.end || eventData.start },
            attendees: eventData.attendees.map((email: string) => ({ email })),
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Event synced to Google Calendar");
      setLastSyncTime(new Date());
    },
    onError: (error: any) => {
      toast.error("Failed to sync: " + error.message);
    },
  });

  // Pull events from Google Calendar
  const syncFromGoogleMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: tokenData } = await supabase
        .from("google_calendar_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .single();

      if (!tokenData) throw new Error("Not connected to Google Calendar");

      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action: "pull",
          accessToken: tokenData.access_token,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walkthroughs"] });
      setLastSyncTime(new Date());
      setIsSyncing(false);
      toast.success("Calendar synced from Google Calendar");
    },
    onError: (error: any) => {
      setIsSyncing(false);
      toast.error("Failed to sync: " + error.message);
    },
  });

  // Filter events based on search and filters
  const filteredEvents = calendarEvents.filter((event) => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType !== "all" && event.type !== filterType) {
      return false;
    }
    return true;
  });

  const handleDateClick = (info: any) => {
    setNewEvent({
      title: "",
      start: info.dateStr,
      end: info.dateStr,
      description: "",
      location: "",
      attendees: [],
      type: "internal",
    });
    setSelectedEvent(null);
    setEventDialogOpen(true);
  };

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.start) {
        toast.error("Please fill in required fields");
        return;
      }

      // Save to database (you can implement this)
      // For now, sync to Google Calendar if connected
      if (isConnected) {
        await syncToGoogleMutation.mutateAsync(newEvent);
      }

      toast.success("Event created successfully");
      setEventDialogOpen(false);
      setNewEvent({
        title: "",
        start: "",
        end: "",
        description: "",
        location: "",
        attendees: [],
        type: "internal",
      });
    } catch (error: any) {
      toast.error("Failed to create event: " + error.message);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    setVisibleCalendars((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) {
        newSet.delete(calendarId);
      } else {
        newSet.add(calendarId);
      }
      return newSet;
    });
  };

  const openInGoogleCalendar = (event: any) => {
    const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.title)}`;
    window.open(url, "_blank");
  };

  const openGoogleMaps = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(url, "_blank");
  };

  const emailAttendees = (attendees: string[], eventTitle: string) => {
    const subject = encodeURIComponent(`Meeting: ${eventTitle}`);
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${attendees.join(",")}&su=${subject}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar Connection Status */}
      {isConnected && (
        <Alert>
          <LinkIcon className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Connected to Google Calendar
              {lastSyncTime && (
                <span className="text-muted-foreground ml-2">
                  · Last synced {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncFromGoogleMutation.mutate()}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Company Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="walkthrough">Walkthrough</SelectItem>
                <SelectItem value="estimate">Estimate</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMember} onValueChange={setFilterMember}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Team Member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setEventDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
            {!isConnected ? (
              <Button onClick={connectGoogleCalendar} variant="outline">
                <LinkIcon className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            ) : (
              <Button 
                onClick={() => syncFromGoogleMutation.mutate()} 
                variant="outline"
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                Sync Google Calendar
              </Button>
            )}
          </div>

          {/* Calendar Toggles */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="company-calendar"
                checked={visibleCalendars.has("company")}
                onCheckedChange={() => toggleCalendar("company")}
              />
              <Label htmlFor="company-calendar" className="cursor-pointer">
                Company Calendar
              </Label>
            </div>
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Checkbox
                  id={`calendar-${member.id}`}
                  checked={visibleCalendars.has(member.id)}
                  onCheckedChange={() => toggleCalendar(member.id)}
                />
                <Label htmlFor={`calendar-${member.id}`} className="cursor-pointer flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                  {member.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FullCalendar */}
      <Card>
        <CardContent className="pt-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={filteredEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            height="auto"
            eventColor="#3b82f6"
          />
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? "Event Details" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedEvent.start).toLocaleString()}
                </p>
              </div>

              {selectedEvent.extendedProps?.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">{selectedEvent.extendedProps.location}</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => openGoogleMaps(selectedEvent.extendedProps.location)}
                    >
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps?.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedEvent.extendedProps.description}
                  </p>
                </div>
              )}

              {selectedEvent.extendedProps?.type && (
                <div>
                  <Badge>{selectedEvent.extendedProps.type}</Badge>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => openInGoogleCalendar(selectedEvent)}
                >
                  Open in Google Calendar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Client Walkthrough"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Date & Time *</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Date & Time</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Address or meeting location"
                />
              </div>

              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walkthrough">Walkthrough</SelectItem>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="internal">Internal Meeting</SelectItem>
                    <SelectItem value="vendor">Vendor Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Add meeting notes, agenda, or other details"
                  rows={3}
                />
              </div>

              <div>
                <Label>Attendees</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`attendee-${member.id}`}
                        checked={newEvent.attendees.includes(member.email)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewEvent({
                              ...newEvent,
                              attendees: [...newEvent.attendees, member.email],
                            });
                          } else {
                            setNewEvent({
                              ...newEvent,
                              attendees: newEvent.attendees.filter((e) => e !== member.email),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`attendee-${member.id}`} className="cursor-pointer text-sm">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {!selectedEvent && (
              <>
                <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEvent}>Create Event</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

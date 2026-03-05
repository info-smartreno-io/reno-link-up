import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { GoogleCalendarSync } from "@/components/GoogleCalendarSync";
import { CreateScheduleDialog } from "@/components/admin/CreateScheduleDialog";

export default function AdminCalendars() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);

  // Fetch team members
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all team members schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['all-team-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractor_schedule')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch walkthroughs
  const { data: walkthroughs } = useQuery({
    queryKey: ['all-walkthroughs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('walkthroughs')
        .select('*')
        .in('status', ['scheduled', 'in_progress'])
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch foreman tasks with dates
  const { data: tasks } = useQuery({
    queryKey: ['all-foreman-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foreman_tasks')
        .select('*')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Generate consistent color for each team member
  const getTeamMemberColor = (userId: string) => {
    const colors = [
      { bg: '#3b82f6', border: '#2563eb' }, // blue
      { bg: '#8b5cf6', border: '#7c3aed' }, // violet
      { bg: '#ec4899', border: '#db2777' }, // pink
      { bg: '#f59e0b', border: '#d97706' }, // amber
      { bg: '#10b981', border: '#059669' }, // emerald
      { bg: '#06b6d4', border: '#0891b2' }, // cyan
      { bg: '#f43f5e', border: '#e11d48' }, // rose
      { bg: '#a855f7', border: '#9333ea' }, // purple
      { bg: '#14b8a6', border: '#0d9488' }, // teal
      { bg: '#6366f1', border: '#4f46e5' }, // indigo
    ];
    
    // Use hash of userId to get consistent color
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Transform data for FullCalendar
  const allEvents = [
    ...(schedules?.map(schedule => {
      const color = getTeamMemberColor(schedule.contractor_id);
      return {
        id: schedule.id,
        title: schedule.title,
        start: `${schedule.event_date}${schedule.event_time ? 'T' + schedule.event_time : ''}`,
        backgroundColor: color.bg,
        borderColor: color.border,
        userId: schedule.contractor_id,
        extendedProps: {
          type: 'schedule',
          description: schedule.description,
          location: schedule.location,
          userId: schedule.contractor_id,
        }
      };
    }) || []),
    ...(walkthroughs?.map(wt => {
      const color = getTeamMemberColor(wt.user_id);
      return {
        id: wt.id,
        title: `Walkthrough: ${wt.project_name}`,
        start: wt.date,
        backgroundColor: color.bg,
        borderColor: color.border,
        userId: wt.user_id,
        extendedProps: {
          type: 'walkthrough',
          location: wt.address,
          client: wt.client_name,
          userId: wt.user_id,
        }
      };
    }) || []),
    ...(tasks?.map(task => {
      const color = getTeamMemberColor(task.contractor_id);
      return {
        id: task.id,
        title: task.task_title,
        start: task.due_date,
        backgroundColor: color.bg,
        borderColor: color.border,
        userId: task.contractor_id,
        extendedProps: {
          type: 'task',
          description: task.description,
          location: task.location,
          priority: task.priority,
          status: task.status,
          userId: task.contractor_id,
        }
      };
    }) || []),
  ];

  // Filter events based on selected team member
  const calendarEvents = selectedMember === "all" 
    ? allEvents 
    : allEvents.filter(event => event.userId === selectedMember);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
  };

  const handleDateClick = (info: any) => {
    setSelectedDate(info.date);
    setSelectedTime(info.dateStr.includes('T') ? format(info.date, 'HH:mm') : undefined);
    setCreateDialogOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['all-team-schedules'] });
    queryClient.invalidateQueries({ queryKey: ['all-walkthroughs'] });
    queryClient.invalidateQueries({ queryKey: ['all-foreman-tasks'] });
    toast.success('Calendar refreshed');
  };

  const getCalendarView = () => {
    switch (view) {
      case 'daily':
        return 'timeGridDay';
      case 'weekly':
        return 'timeGridWeek';
      case 'monthly':
        return 'dayGridMonth';
      default:
        return 'timeGridWeek';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Calendars</h1>
            <p className="text-muted-foreground">
              View all SmartReno team members' schedules, walkthroughs, and tasks
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || 'Unnamed User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <GoogleCalendarSync />
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value={view} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-2 p-6">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={getCalendarView()}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  selectable={true}
                  height="auto"
                  slotMinTime="06:00:00"
                  slotMaxTime="20:00:00"
                  allDaySlot={true}
                  weekends={true}
                  nowIndicator={true}
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5],
                    startTime: '08:00',
                    endTime: '17:00',
                  }}
                />
              </Card>

              {/* Event Details & Map */}
              <div className="space-y-6">
                {selectedEvent && (
                  <>
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Event Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium">Title:</span>
                          <p className="text-muted-foreground">{selectedEvent.title}</p>
                        </div>
                        
                        {selectedEvent.extendedProps.type && (
                          <div>
                            <span className="font-medium">Type:</span>
                            <p className="text-muted-foreground capitalize">
                              {selectedEvent.extendedProps.type}
                            </p>
                          </div>
                        )}

                        {selectedEvent.extendedProps.description && (
                          <div>
                            <span className="font-medium">Description:</span>
                            <p className="text-muted-foreground">
                              {selectedEvent.extendedProps.description}
                            </p>
                          </div>
                        )}

                        {selectedEvent.extendedProps.location && (
                          <div>
                            <span className="font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Location:
                            </span>
                            <p className="text-muted-foreground">
                              {selectedEvent.extendedProps.location}
                            </p>
                          </div>
                        )}

                        {selectedEvent.extendedProps.priority && (
                          <div>
                            <span className="font-medium">Priority:</span>
                            <p className="text-muted-foreground capitalize">
                              {selectedEvent.extendedProps.priority}
                            </p>
                          </div>
                        )}

                        {selectedEvent.extendedProps.status && (
                          <div>
                            <span className="font-medium">Status:</span>
                            <p className="text-muted-foreground capitalize">
                              {selectedEvent.extendedProps.status}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {selectedEvent.extendedProps.location && (
                      <Card className="p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location Map
                        </h3>
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${encodeURIComponent(selectedEvent.extendedProps.location)}`}
                            allowFullScreen
                          />
                        </div>
                      </Card>
                    )}
                  </>
                )}

                {!selectedEvent && (
                  <Card className="p-6">
                    <p className="text-sm text-muted-foreground text-center">
                      Click on an event to view details and location
                    </p>
                  </Card>
                )}

                {/* Legend */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Team Members</h3>
                  <div className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
                    <TooltipProvider>
                      {selectedMember === "all" && teamMembers?.map((member) => {
                        const color = getTeamMemberColor(member.id);
                        const memberEvents = allEvents.filter(e => e.userId === member.id);
                        const eventCount = memberEvents.length;
                        const scheduleCount = memberEvents.filter(e => e.extendedProps.type === 'schedule').length;
                        const taskCount = memberEvents.filter(e => e.extendedProps.type === 'task').length;
                        const walkthroughCount = memberEvents.filter(e => e.extendedProps.type === 'walkthrough').length;
                        
                        return (
                          <div 
                            key={member.id} 
                            className="flex items-center gap-2 justify-between p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => setSelectedMember(member.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded" 
                                style={{ backgroundColor: color.bg }}
                              />
                              <span>{member.full_name || 'Unnamed User'}</span>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="ml-auto cursor-help">
                                  {eventCount}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="p-3">
                                <div className="space-y-1 text-xs">
                                  <div className="font-semibold mb-2">Event Breakdown</div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">Schedules:</span>
                                    <span className="font-medium">{scheduleCount}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">Tasks:</span>
                                    <span className="font-medium">{taskCount}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-muted-foreground">Walkthroughs:</span>
                                    <span className="font-medium">{walkthroughCount}</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })}
                    </TooltipProvider>
                    {selectedMember !== "all" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Viewing: {teamMembers?.find(m => m.id === selectedMember)?.full_name}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedMember("all")}
                          >
                            Show All
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Click "Show All" to view all team members
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <CreateScheduleDialog 
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      </div>
    </AdminLayout>
  );
}

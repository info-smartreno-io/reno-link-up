import { useState, useEffect } from "react";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { GoogleCalendarSync } from "@/components/GoogleCalendarSync";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoCalendarEvents, getDemoTasks } from "@/utils/demoContractorData";

export default function ContractorCalendar() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setUserId('demo-user');
      return;
    }
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [isDemoMode]);

  // Fetch contractor's schedules
  const { data: schedules } = useQuery({
    queryKey: ['contractor-schedules', userId, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoCalendarEvents();
      }
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('contractor_schedule')
        .select('*')
        .eq('contractor_id', userId)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId || isDemoMode
  });

  // Fetch contractor's tasks
  const { data: tasks } = useQuery({
    queryKey: ['contractor-tasks', userId, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoTasks();
      }
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('foreman_tasks')
        .select('*')
        .eq('contractor_id', userId)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true});
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId || isDemoMode
  });

  // Transform data for FullCalendar
  const calendarEvents = [
    ...(schedules?.map((schedule: any) => ({
      id: schedule.id,
      title: schedule.title || schedule.task_title,
      start: schedule.event_date ? `${schedule.event_date}${schedule.event_time ? 'T' + schedule.event_time : ''}` : schedule.due_date,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      extendedProps: {
        type: 'schedule',
        description: schedule.description,
        location: schedule.location,
      }
    })) || []),
    ...(tasks?.map((task: any) => ({
      id: task.id,
      title: task.task_title,
      start: task.due_date,
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      extendedProps: {
        type: 'task',
        description: task.description,
        location: task.location,
        priority: task.priority,
        status: task.status,
      }
    })) || []),
  ];

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['contractor-schedules'] });
    queryClient.invalidateQueries({ queryKey: ['contractor-tasks'] });
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
    <ContractorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Calendar</h1>
            <p className="text-muted-foreground">
              Manage your schedule, tasks, and appointments
            </p>
          </div>
          <div className="flex gap-2">
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
                        
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="text-muted-foreground capitalize">
                            {selectedEvent.extendedProps.type}
                          </p>
                        </div>

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
                            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(selectedEvent.extendedProps.location)}`}
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
                  <h3 className="font-semibold mb-4">Event Types</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-[#3b82f6]" />
                      <span>Scheduled Events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-[#f59e0b]" />
                      <span>Tasks & Deadlines</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ContractorLayout>
  );
}

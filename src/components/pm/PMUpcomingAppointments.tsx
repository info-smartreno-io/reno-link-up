import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, MapPin, Clock, ChevronRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  projectName?: string;
}

export function PMUpcomingAppointments() {
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['pm-upcoming-appointments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Fetch upcoming project meetings as appointments
      const { data: projectMeetings } = await supabase
        .from('project_meetings')
        .select(`
          id,
          meeting_title,
          meeting_type,
          scheduled_date,
          scheduled_time,
          notes,
          project_id,
          projects (
            project_name
          )
        `)
        .gte('scheduled_date', now.toISOString().split('T')[0])
        .lte('scheduled_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .is('completed_at', null)
        .order('scheduled_date', { ascending: true })
        .limit(5);

      const items: Appointment[] = [];

      projectMeetings?.forEach(meeting => {
        const scheduledDate = new Date(meeting.scheduled_date);
        items.push({
          id: meeting.id,
          title: meeting.meeting_title || meeting.meeting_type || 'Meeting',
          date: meeting.scheduled_date,
          time: meeting.scheduled_time || format(scheduledDate, 'h:mm a'),
          location: meeting.notes || 'Location TBD',
          type: meeting.meeting_type?.toLowerCase().includes('inspection') ? 'inspection' 
              : meeting.meeting_type?.toLowerCase().includes('walkthrough') ? 'walkthrough'
              : 'meeting',
          projectName: meeting.projects?.project_name
        });
      });

      return items;
    }
  });

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'inspection':
        return <Badge className="bg-blue-500/20 text-blue-500 text-xs">Inspection</Badge>;
      case 'walkthrough':
        return <Badge className="bg-purple-500/20 text-purple-500 text-xs">Walkthrough</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Meeting</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            Upcoming Appointments
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => navigate('/contractor/pm-appointments')}
          >
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!appointments || appointments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-5 w-5 mr-2" />
            No upcoming appointments
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <div
                key={apt.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate('/contractor/pm-appointments')}
              >
                <div className="flex flex-col items-center justify-center min-w-[50px] py-1 px-2 rounded bg-primary/10">
                  <span className="text-xs font-medium text-primary">{getDateLabel(apt.date)}</span>
                  <span className="text-xs text-muted-foreground">{apt.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{apt.title}</p>
                    {getTypeBadge(apt.type)}
                  </div>
                  {apt.projectName && (
                    <p className="text-xs text-muted-foreground truncate">{apt.projectName}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{apt.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

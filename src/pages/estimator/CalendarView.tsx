import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleMapPreview } from "@/components/GoogleMapPreview";
import { GoogleCalendarSync } from "@/components/GoogleCalendarSync";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const mockEvents = [
  { 
    id: "1",
    date: "2025-01-20", 
    time: "9:00 AM", 
    title: "Kitchen Remodel Walkthrough", 
    type: "walkthrough",
    address: "123 Main Street, Paramus, NJ 07652",
    clientEmail: "client@example.com",
    notes: "Full kitchen renovation estimate"
  },
  { 
    id: "2",
    date: "2025-01-20", 
    time: "11:00 AM", 
    title: "Roof Inspection Walkthrough", 
    type: "walkthrough",
    address: "456 Oak Avenue, Ridgewood, NJ 07450",
    clientEmail: "homeowner@example.com",
    notes: "Roof repair assessment"
  },
  { id: "3", date: "2025-01-20", time: "2:00 PM", title: "Client Meeting", type: "meeting" },
  { id: "4", date: "2025-01-21", time: "10:00 AM", title: "Estimate Review", type: "estimate" },
];

export default function EstimatorCalendar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDate] = useState(new Date(2025, 0, 20));
  const [selectedEvent, setSelectedEvent] = useState<typeof mockEvents[0] | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const sendCalendarInvite = async (event: typeof mockEvents[0]) => {
    if (!event.address || !event.clientEmail) {
      toast({
        title: "Cannot Send Invite",
        description: "Event must have an address and client email",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-calendar-invite', {
        body: {
          to: event.clientEmail,
          walkthrough: {
            id: event.id,
            date: event.date,
            time: event.time,
            address: event.address,
            notes: event.notes,
          },
          estimatorName: 'Thomas Burns',
        }
      });

      if (error) throw error;

      toast({
        title: "Calendar Invite Sent",
        description: `Invitation sent to ${event.clientEmail}`,
      });
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      toast({
        title: "Error",
        description: "Failed to send calendar invite",
        variant: "destructive",
      });
    }
  };

  // Set up realtime subscription for walkthroughs
  useEffect(() => {
    const channel = supabase
      .channel('walkthrough-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'walkthroughs'
        },
        (payload) => {
          console.log('Walkthrough changed:', payload);
          toast({
            title: 'Calendar Updated',
            description: 'Your calendar has been updated with changes',
          });
          // In a real app, you would refresh the calendar data here
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const typeColors: Record<string, string> = {
    walkthrough: "bg-blue-500",
    meeting: "bg-purple-500",
    estimate: "bg-green-500",
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/estimator/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule and appointments</p>
          </div>
          <div className="flex items-center gap-2">
            {userId && <GoogleCalendarSync userId={userId} />}
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 1; // Starting from day 0 (adjust as needed for your calendar logic)
                const isToday = day === 20;
                const hasEvents = day === 20 || day === 21;
                
                return (
                  <div
                    key={i}
                    className={`
                      aspect-square p-2 border rounded-lg text-sm
                      ${day > 0 && day <= 31 ? "hover:bg-accent cursor-pointer" : "bg-muted/30"}
                      ${isToday ? "border-primary bg-primary/5" : ""}
                    `}
                  >
                    {day > 0 && day <= 31 && (
                      <>
                        <div className={`font-medium ${isToday ? "text-primary" : ""}`}>{day}</div>
                        {hasEvents && (
                          <div className="mt-1">
                            <div className="h-1 w-1 rounded-full bg-primary"></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockEvents.map((event) => (
              <div 
                key={event.id} 
                className="border rounded-lg hover:bg-accent transition-colors overflow-hidden"
              >
                <div 
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                >
                  <div className={`h-2 w-2 rounded-full mt-2 ${typeColors[event.type]}`} />
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.date} at {event.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.type}</Badge>
                    {event.address && event.clientEmail && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendCalendarInvite(event);
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {selectedEvent?.id === event.id && event.address && (
                  <div className="px-3 pb-3 space-y-3 border-t pt-3 bg-muted/30">
                    <GoogleMapPreview address={event.address} />
                    {event.notes && (
                      <p className="text-sm text-muted-foreground">{event.notes}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

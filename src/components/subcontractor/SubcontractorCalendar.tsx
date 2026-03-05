import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: "project" | "bid_due";
  trade?: string;
  address?: string;
}

export function SubcontractorCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["subcontractor-calendar-events"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const calendarEvents: CalendarEvent[] = [];

      // Fetch awarded bids with confirmed dates
      const { data: awardedBids } = await supabase
        .from("sub_bid_responses")
        .select(`
          id,
          scheduled_start_date,
          scheduled_end_date,
          date_confirmed_at,
          package:sub_bid_packages(trade, project_address)
        `)
        .eq("subcontractor_id", userData.user.id)
        .eq("is_awarded", true)
        .not("scheduled_start_date", "is", null);

      if (awardedBids) {
        awardedBids.forEach((bid: any) => {
          if (bid.scheduled_start_date) {
            calendarEvents.push({
              id: bid.id,
              title: bid.package?.trade || "Project Work",
              date: bid.scheduled_start_date,
              endDate: bid.scheduled_end_date,
              type: "project",
              trade: bid.package?.trade,
              address: bid.package?.project_address,
            });
          }
        });
      }

      // Fetch open bid invitations with due dates
      const { data: bidInvitations } = await supabase
        .from("sub_bid_invitations")
        .select(`
          id,
          package:sub_bid_packages(trade, due_date, project_address)
        `)
        .eq("subcontractor_id", userData.user.id)
        .eq("status", "pending");

      if (bidInvitations) {
        bidInvitations.forEach((inv: any) => {
          if (inv.package?.due_date) {
            calendarEvents.push({
              id: inv.id,
              title: `Bid Due: ${inv.package?.trade}`,
              date: inv.package.due_date,
              type: "bid_due",
              trade: inv.package?.trade,
              address: inv.package?.project_address,
            });
          }
        });
      }

      return calendarEvents;
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), day));
  };

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => isFuture(new Date(e.date)) || isToday(new Date(e.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}

            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`h-20 p-1 border rounded-lg ${
                    isCurrentDay ? "bg-primary/10 border-primary" : "border-border"
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${isCurrentDay ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          event.type === "project"
                            ? "bg-green-500/20 text-green-700"
                            : "bg-orange-500/20 text-orange-700"
                        }`}
                      >
                        {event.trade || event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No upcoming events
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      {event.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {event.address}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        event.type === "project"
                          ? "bg-green-500/10 text-green-700"
                          : "bg-orange-500/10 text-orange-700"
                      }
                    >
                      {event.type === "project" ? "Work" : "Bid Due"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(event.date), "MMM d, yyyy")}
                    {event.endDate && ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

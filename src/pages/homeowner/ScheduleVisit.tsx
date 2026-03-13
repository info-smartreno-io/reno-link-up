import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarDays, MapPin, Clock, AlertCircle, Users, MessageCircle } from "lucide-react";
import { addDays, isBefore, startOfToday } from "date-fns";

const TIME_SLOTS = [
  "11-12",
  "12-1",
  "1-2",
  "5-6",
  "6-7",
  "7-8",
] as const;

const TIME_SLOT_LABELS: Record<string, string> = {
  "11-12": "11:00 AM – 12:00 PM",
  "12-1": "12:00 PM – 1:00 PM",
  "1-2": "1:00 PM – 2:00 PM",
  "5-6": "5:00 PM – 6:00 PM",
  "6-7": "6:00 PM – 7:00 PM",
  "7-8": "7:00 PM – 8:00 PM",
};

export default function ScheduleVisit() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [visitWith, setVisitWith] = useState<string>("");

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ["homeowner-intake-project-schedule"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, address, city, zip_code, project_name, visit_with")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;

      // Find the most recent contractor project linked to this homeowner
      const { data: hp } = await supabase
        .from("homeowner_projects")
        .select("project_id, created_at")
        .eq("homeowner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...data,
        contractor_project_id: hp?.project_id ?? null,
      } as any;
    },
    staleTime: 30000,
  });

  const addressLine = [project?.address, project?.city, project?.zip_code].filter(Boolean).join(", ");
  const fullAddress = addressLine ? `${addressLine}, NJ` : "";
  const hasProject = !!project;

  useEffect(() => {
    if (project && (project as any).visit_with) {
      setVisitWith((project as any).visit_with as string);
    }
  }, [project]);

  const handleConfirm = async () => {
    if (!project) {
      toast.error("Please submit your renovation request first. Once approved, you’ll be able to schedule a visit here.");
      return;
    }
    if (!project?.id || !selectedDate || !selectedSlot || !visitWith) {
      toast.error("Please select a date, time, and who the visit is with.");
      return;
    }
    const [startHour] = selectedSlot.split("-").map(Number);
    const visitAt = new Date(selectedDate);
    visitAt.setHours(startHour, 0, 0, 0);

    setConfirming(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          scheduled_visit_at: visitAt.toISOString(),
          visit_confirmed: true,
          visit_with: visitWith,
        } as any)
        .eq("id", project.id);

      if (error) throw error;

      // Try to push this visit to the shared SmartReno calendar (info@smartreno.io)
      try {
        await supabase.functions.invoke("homeowner-site-visit-calendar", {
          body: {
            projectId: project.id,
            scheduledAt: visitAt.toISOString(),
            visitWith,
            address: fullAddress || null,
          },
        });
      } catch (calendarErr) {
        console.warn("Failed to sync visit to Google Calendar", calendarErr);
      }

      // Post an automatic system message into the project chat, if a contractor project exists
      try {
        const contractorProjectId = (project as any).contractor_project_id as string | null | undefined;
        if (contractorProjectId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const roleLabel = (() => {
              switch (visitWith) {
                case "construction_agent":
                  return "a construction agent";
                case "client_success":
                  return "a client success partner";
                case "pm":
                  return "a project manager";
                case "design_pro":
                  return "a design pro";
                case "architect":
                  return "an architect";
                case "contractor":
                  return "the contractor";
                default:
                  return "our team";
              }
            })();

            const whenLabel = `${visitAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })} at ${visitAt.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}`;

            const systemMessage = `Site visit scheduled for ${whenLabel} with ${roleLabel}. This message was created automatically so everyone has the same details.`;

            await supabase.from("project_messages").insert({
              project_id: contractorProjectId,
              sender_id: user.id,
              message: systemMessage,
            } as any);
          }
        }
      } catch (msgErr) {
        console.warn("Failed to create automatic visit message", msgErr);
      }

      toast.success("Site visit scheduled. Next, share a few more details about your project.");
      navigate("/homeowner/project-details", { replace: true });
    } catch (err: any) {
      console.error("Schedule visit error:", err);
      toast.error(err?.message ?? "Failed to schedule visit. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const minDate = addDays(startOfToday(), 1);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Schedule Your Site Visit</h1>
        <Card className="border-destructive/50">
          <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground">
              We couldn’t load your project. Please try again or return to the dashboard.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/homeowner/dashboard")}>
                Back to Dashboard
              </Button>
              <Button onClick={() => refetch()}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already confirmed: show message and CTA to project details or dashboard
  if (project && (project as { visit_confirmed?: boolean }).visit_confirmed === true) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Schedule Your Site Visit</h1>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-foreground">
              You’ve already scheduled your site visit. Add more project details or return to your dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate("/homeowner/project-details")}>
                Add project details
              </Button>
              <Button variant="outline" onClick={() => navigate("/homeowner/dashboard")}>
                Back to Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(
                    `/homeowner/projects/${(project as any).contractor_project_id || project.id}/messages`
                  )
                }
                className="inline-flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Open chat about this visit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Schedule Your Site Visit</h1>
        <p className="text-muted-foreground mt-1">
          {hasProject
            ? "Choose a date and time for our estimator to visit your home and review your project."
            : "Once your renovation request is submitted and intake steps are complete, you'll be able to pick a visit time here."}
        </p>
      </div>

      {fullAddress && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Visit address</p>
              <p className="text-sm text-muted-foreground">{fullAddress}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Select date
          </CardTitle>
        </CardHeader>
        <CardContent
          className={`pt-4 pb-6 ${hasProject ? "" : "opacity-50 pointer-events-none"}`}
        >
          <div className="flex flex-col items-center">
            <div className="scale-110 md:scale-115 origin-top">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  isBefore(date, minDate) ||
                  date.getDay() === 0 ||
                  date.getDay() === 6
                }
                initialFocus
                showOutsideDays
                className="rounded-lg border border-border bg-background p-4 shadow-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select time
          </CardTitle>
        </CardHeader>
        <CardContent className={hasProject ? "" : "opacity-50 pointer-events-none"}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => (
              <Button
                key={slot}
                type="button"
                variant={selectedSlot === slot ? "default" : "outline"}
                size="sm"
                className={
                  selectedSlot === slot
                    ? "shadow-sm"
                    : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                }
                onClick={() => setSelectedSlot(selectedSlot === slot ? "" : slot)}
              >
                {TIME_SLOT_LABELS[slot] ?? slot}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Who is this visit with?
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-2 ${hasProject ? "" : "opacity-50 pointer-events-none"}`}>
          <Label className="text-xs text-muted-foreground">
            For now, visits are scheduled with a SmartReno construction agent. Other visit types will be enabled later.
          </Label>
          <Select value={visitWith} onValueChange={setVisitWith}>
            <SelectTrigger>
              <SelectValue placeholder="Select who this visit will be with" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="construction_agent">Construction agent</SelectItem>
              <SelectItem value="client_success" disabled>
                Client success (coming soon)
              </SelectItem>
              <SelectItem value="pm" disabled>
                Project manager (coming soon)
              </SelectItem>
              <SelectItem value="design_pro" disabled>
                Design pro / designer (coming soon)
              </SelectItem>
              <SelectItem value="architect" disabled>
                Architect (coming soon)
              </SelectItem>
              <SelectItem value="contractor" disabled>
                Contractor (coming soon)
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        We plan to arrive near the beginning of your selected time window. You&apos;ll receive a text
        message reminder approximately one hour before your scheduled site visit.
      </p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/homeowner/dashboard")}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!hasProject || !selectedDate || !selectedSlot || !visitWith || confirming}
        >
          {confirming ? "Scheduling…" : "Confirm visit"}
        </Button>
      </div>
    </div>
  );
}

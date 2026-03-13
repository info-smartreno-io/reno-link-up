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
  "10-11",
  "11-12",
  "12-1",
  "1-2",
  "2-3",
  "3-4",
  "4-5",
  "6-7",
  "7-8",
] as const;

const TIME_SLOT_LABELS: Record<string, string> = {
  "10-11": "10:00 AM – 11:00 AM",
  "11-12": "11:00 AM – 12:00 PM",
  "12-1": "12:00 PM – 1:00 PM",
  "1-2": "1:00 PM – 2:00 PM",
  "2-3": "2:00 PM – 3:00 PM",
  "3-4": "3:00 PM – 4:00 PM",
  "4-5": "4:00 PM – 5:00 PM",
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
        .select("id, address, city, zip_code, project_name, name, visit_with")
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

  useEffect(() => {
    if (project && (project as any).visit_with) {
      setVisitWith((project as any).visit_with as string);
    }
  }, [project]);

  const handleConfirm = async () => {
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

  // No intake project: redirect to dashboard
  useEffect(() => {
    if (isLoading || isError) return;
    if (!project) {
      navigate("/homeowner/dashboard", { replace: true });
    }
  }, [isLoading, isError, project, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 max-w-2xl">
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

  if (!project) {
    return null;
  }

  // Already confirmed: show message and CTA to project details or dashboard
  if ((project as { visit_confirmed?: boolean }).visit_confirmed === true) {
    return (
      <div className="space-y-6 max-w-2xl">
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Schedule Your Site Visit</h1>
        <p className="text-muted-foreground mt-1">
          Choose a date and time for our estimator to visit your home and review your project.
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
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => isBefore(date, minDate)}
            initialFocus
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => (
              <Button
                key={slot}
                type="button"
                variant={selectedSlot === slot ? "default" : "outline"}
                size="sm"
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
        <CardContent className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            This helps route your visit to the right SmartReno teammate.
          </Label>
          <Select value={visitWith} onValueChange={setVisitWith}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team member type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="construction_agent">Construction agent</SelectItem>
              <SelectItem value="client_success">Client success</SelectItem>
              <SelectItem value="pm">Project manager</SelectItem>
              <SelectItem value="design_pro">Design pro</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/homeowner/dashboard")}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedSlot || !visitWith || confirming}
        >
          {confirming ? "Scheduling…" : "Confirm visit"}
        </Button>
      </div>
    </div>
  );
}

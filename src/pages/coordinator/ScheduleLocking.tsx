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
import { Loader2, Calendar as CalendarIcon, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Project {
  id: string;
  client_name: string;
  project_type: string;
  location: string;
  status: string;
  deadline: string | null;
}

const PREREQUISITE_CHECKS = [
  { id: "scope_finalized", label: "Project scope is finalized and signed off" },
  { id: "materials_ordered", label: "All materials have been ordered" },
  { id: "permits_approved", label: "All required permits are approved" },
  { id: "lead_times_confirmed", label: "Material lead times confirmed with vendors" },
  { id: "subcontractors_booked", label: "Subcontractors scheduled and confirmed" },
  { id: "site_access_confirmed", label: "Site access and logistics confirmed" },
  { id: "payment_schedule_approved", label: "Payment schedule approved by homeowner" },
  { id: "insurance_verified", label: "Insurance certificates current and verified" },
];

export default function ScheduleLocking() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [prerequisites, setPrerequisites] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchScheduleData();
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
      
      if (data.deadline) {
        setStartDate(new Date(data.deadline));
      }
      
      setIsLocked(data.status === "schedule_locked" || data.status === "in_production");
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

  const fetchScheduleData = async () => {
    try {
      const { data, error } = await supabase
        .from("project_schedule_locks")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setPrerequisites((data.prerequisites as Record<string, boolean>) || {});
        setNotes(data.notes || "");
        setEstimatedDuration(data.estimated_duration_weeks?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    }
  };

  const togglePrerequisite = (id: string) => {
    setPrerequisites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allPrerequisitesMet = () => {
    return PREREQUISITE_CHECKS.every(check => prerequisites[check.id]);
  };

  const handleLockSchedule = async () => {
    if (!startDate || !estimatedDuration) {
      toast({
        title: "Missing Information",
        description: "Please select a start date and estimated duration.",
        variant: "destructive",
      });
      return;
    }

    if (!allPrerequisitesMet()) {
      toast({
        title: "Prerequisites Not Met",
        description: "Please complete all prerequisite checks before locking the schedule.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save schedule lock data
      const { error: lockError } = await supabase
        .from("project_schedule_locks")
        .upsert({
          project_id: projectId,
          start_date: format(startDate, "yyyy-MM-dd"),
          estimated_duration_weeks: parseInt(estimatedDuration),
          prerequisites,
          notes,
          locked_at: new Date().toISOString(),
          locked_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (lockError) throw lockError;

      // Update project status and deadline
      const { error: projectError } = await supabase
        .from("contractor_projects")
        .update({
          status: "schedule_locked",
          deadline: format(startDate, "yyyy-MM-dd"),
        })
        .eq("id", projectId);

      if (projectError) throw projectError;

      toast({
        title: "Schedule Locked",
        description: "Project schedule has been locked and is ready for production handoff.",
      });

      setIsLocked(true);
      fetchProjectData();
    } catch (error: any) {
      console.error("Error locking schedule:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to lock schedule.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlockSchedule = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("contractor_projects")
        .update({ status: "materials_ordered" })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Schedule Unlocked",
        description: "Project schedule has been unlocked for modifications.",
      });

      setIsLocked(false);
      fetchProjectData();
    } catch (error: any) {
      console.error("Error unlocking schedule:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to unlock schedule.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Schedule Locking</h1>
            <p className="text-muted-foreground">
              {project?.client_name} - {project?.project_type}
            </p>
            <Badge className="mt-2" variant={isLocked ? "default" : "outline"}>
              {isLocked ? "Schedule Locked" : "Schedule Unlocked"}
            </Badge>
          </div>
        </div>

        {isLocked && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Schedule Locked</AlertTitle>
            <AlertDescription>
              This project schedule is locked and ready for production. All prerequisites have been met.
              To make changes, unlock the schedule first.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Schedule</CardTitle>
                <CardDescription>
                  Set the start date and confirm all prerequisites are complete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={isLocked}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Duration (weeks) *</Label>
                    <Input
                      type="number"
                      disabled={isLocked}
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Schedule Notes</Label>
                  <Textarea
                    disabled={isLocked}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special considerations, weather dependencies, homeowner travel dates..."
                    rows={3}
                  />
                </div>

                {startDate && estimatedDuration && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Estimated Completion</p>
                    <p className="text-lg font-semibold">
                      {format(
                        new Date(startDate.getTime() + parseInt(estimatedDuration) * 7 * 24 * 60 * 60 * 1000),
                        "MMMM d, yyyy"
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prerequisite Checklist</CardTitle>
                <CardDescription>
                  All items must be checked before locking the schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PREREQUISITE_CHECKS.map(check => (
                  <div key={check.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox
                      id={check.id}
                      disabled={isLocked}
                      checked={prerequisites[check.id] || false}
                      onCheckedChange={() => togglePrerequisite(check.id)}
                    />
                    <label
                      htmlFor={check.id}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                    >
                      {check.label}
                    </label>
                    {prerequisites[check.id] && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Readiness Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prerequisites</span>
                    <Badge variant={allPrerequisitesMet() ? "default" : "outline"}>
                      {Object.values(prerequisites).filter(Boolean).length}/{PREREQUISITE_CHECKS.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Start Date</span>
                    {startDate ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Duration</span>
                    {estimatedDuration ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>

                {!isLocked ? (
                  <Button
                    onClick={handleLockSchedule}
                    disabled={saving || !allPrerequisitesMet() || !startDate || !estimatedDuration}
                    className="w-full gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Locking...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Lock Schedule
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleUnlockSchedule}
                    disabled={saving}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Unlocking...
                      </>
                    ) : (
                      "Unlock Schedule"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Review all material delivery dates</p>
                <p>✓ Confirm subcontractor availability</p>
                <p>✓ Notify homeowner of start date</p>
                <p>✓ Schedule pre-construction meeting</p>
                <p>✓ Hand off to production manager</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

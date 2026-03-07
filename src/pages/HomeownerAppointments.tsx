import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestVisitTimeDialog } from "@/components/homeowner/RequestVisitTimeDialog";
import { Calendar, Clock, MapPin, User, ArrowLeft, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  project_id: string;
  purpose: string;
  requested_start: string;
  requested_end: string | null;
  proposed_start: string | null;
  proposed_end: string | null;
  final_start: string | null;
  final_end: string | null;
  status: string;
  homeowner_note: string | null;
  sub_note: string | null;
  pm_note: string | null;
  created_at: string;
  project_name?: string;
  project_location?: string;
}

export default function HomeownerAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await fetchProjects();
    await fetchAppointments();
  };

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: homeownerProjects } = await supabase
        .from("homeowner_projects")
        .select(`
          project_id,
          contractor_projects!inner(
            id,
            project_name,
            location,
            status
          )
        `)
        .eq("homeowner_id", user.id);

      const projectsList = (homeownerProjects || []).map((hp: any) => ({
        id: hp.contractor_projects.id,
        name: hp.contractor_projects.project_name,
        location: hp.contractor_projects.location,
        status: hp.contractor_projects.status,
      }));

      setProjects(projectsList);
      if (projectsList.length > 0) {
        setSelectedProject(projectsList[0].id);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: homeownerProjects } = await supabase
        .from("homeowner_projects")
        .select("project_id")
        .eq("homeowner_id", user.id);

      const projectIds = (homeownerProjects || []).map((hp: any) => hp.project_id);

      if (projectIds.length === 0) {
        setAppointments([]);
        return;
      }

      const { data: appointmentsData, error } = await supabase
        .from("project_appointments" as any)
        .select(`
          *,
          contractor_projects!inner(
            project_name,
            location
          )
        `)
        .in("project_id", projectIds)
        .order("requested_start", { ascending: false });

      if (error) throw error;

      const formattedAppointments = ((appointmentsData as any) || []).map((apt: any) => ({
        ...apt,
        project_name: apt.contractor_projects?.project_name,
        project_location: apt.contractor_projects?.location,
      }));

      setAppointments(formattedAppointments);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load appointments",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      requested_by_homeowner: {
        label: "Pending",
        variant: "secondary",
        icon: AlertCircle,
      },
      sent_to_sub: {
        label: "Awaiting Confirmation",
        variant: "outline",
        icon: Clock,
      },
      sub_countered: {
        label: "Counter Proposed",
        variant: "outline",
        icon: AlertCircle,
      },
      confirmed: {
        label: "Confirmed",
        variant: "default",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Cancelled",
        variant: "destructive",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
      icon: AlertCircle,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDisplayTime = (appointment: Appointment) => {
    if (appointment.final_start) {
      return {
        start: new Date(appointment.final_start),
        end: appointment.final_end ? new Date(appointment.final_end) : null,
        label: "Confirmed Time",
      };
    }
    if (appointment.proposed_start) {
      return {
        start: new Date(appointment.proposed_start),
        end: appointment.proposed_end ? new Date(appointment.proposed_end) : null,
        label: "Proposed Time",
      };
    }
    return {
      start: new Date(appointment.requested_start),
      end: appointment.requested_end ? new Date(appointment.requested_end) : null,
      label: "Requested Time",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/homeowner/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Visit Appointments</h1>
                <p className="text-sm text-muted-foreground">
                  Manage site visit requests and confirmations
                </p>
              </div>
            </div>
            <Button
              onClick={() => setRequestDialogOpen(true)}
              disabled={projects.length === 0}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Request Visit
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Appointments Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't requested any site visits yet. Click the button above to schedule your first visit.
              </p>
              {projects.length > 0 && (
                <Button onClick={() => setRequestDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Request Your First Visit
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const displayTime = getDisplayTime(appointment);
              
              return (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{appointment.purpose}</CardTitle>
                        <CardDescription className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {appointment.project_name}
                          </span>
                          {appointment.project_location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {appointment.project_location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Time Display */}
                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {displayTime.label}
                        </div>
                        <div className="text-base font-semibold">
                          {format(displayTime.start, "EEEE, MMMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(displayTime.start, "h:mm a")}
                            {displayTime.end && ` - ${format(displayTime.end, "h:mm a")}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.homeowner_note && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Your Note:</div>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {appointment.homeowner_note}
                        </div>
                      </div>
                    )}

                    {appointment.pm_note && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Project Manager Note:</div>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {appointment.pm_note}
                        </div>
                      </div>
                    )}

                    {appointment.sub_note && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Contractor Note:</div>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {appointment.sub_note}
                        </div>
                      </div>
                    )}

                    {/* Status-specific messages */}
                    {appointment.status === "requested_by_homeowner" && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                          Your request is pending. The project manager will review and assign it to the appropriate team member.
                        </div>
                      </div>
                    )}

                    {appointment.status === "sent_to_sub" && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div className="text-sm text-yellow-900 dark:text-yellow-100">
                          Your request has been forwarded to the contractor. Waiting for their confirmation.
                        </div>
                      </div>
                    )}

                    {appointment.status === "sub_countered" && (
                      <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div className="text-sm text-orange-900 dark:text-orange-100">
                          The contractor has proposed an alternative time. The project manager is reviewing it.
                        </div>
                      </div>
                    )}

                    {appointment.status === "confirmed" && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="text-sm text-green-900 dark:text-green-100">
                          This visit is confirmed! The contractor will be at the site at the scheduled time.
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Requested on {format(new Date(appointment.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Dialog */}
      <RequestVisitTimeDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        projectId={selectedProject}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}

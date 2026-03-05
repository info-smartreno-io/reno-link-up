import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForwardAppointmentCard } from "@/components/contractor/ForwardAppointmentCard";
import { Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, XCircle, Home } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoPMAppointments } from "@/utils/demoContractorData";

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
  forwarded_to_user_id: string | null;
  forwarded_to_role: string | null;
  requested_by_user_id: string;
  project?: any;
  homeowner?: any;
  foreman?: any;
}

export default function PMAppointmentsDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setAppointments(getDemoPMAppointments() as Appointment[]);
      setLoading(false);
      return;
    }
    checkAuth();
  }, [isDemoMode]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has PM role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasRole = roles?.some(r => 
      r.role === "project_manager" || r.role === "admin"
    );

    if (!hasRole) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page",
      });
      navigate("/");
      return;
    }

    await fetchAppointments();
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("project_appointments" as any)
        .select(`
          *,
          contractor_projects!inner(
            id,
            project_name,
            location,
            client_name
          )
        `)
        .in("status", ["requested_by_homeowner", "sent_to_sub", "sub_countered"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch additional details for each appointment
      const enrichedAppointments = await Promise.all(
        ((data as any) || []).map(async (apt: any) => {
          const enriched: any = {
            ...apt,
            project: apt.contractor_projects,
          };

          // Get homeowner info
          const { data: homeownerProjects } = await supabase
            .from("homeowner_projects")
            .select(`
              homeowner_id,
              profiles!inner(full_name, email)
            `)
            .eq("project_id", apt.project_id)
            .limit(1)
            .single();

          if (homeownerProjects) {
            enriched.homeowner = (homeownerProjects as any).profiles;
          }

          // Get forwarded user info if applicable
          if (apt.forwarded_to_user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", apt.forwarded_to_user_id)
              .single();

            enriched.foreman = profile;
          }

          return enriched;
        })
      );

      setAppointments(enrichedAppointments);
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

  const handleConfirmProposal = async (appointmentId: string) => {
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Confirmations are disabled in demo mode" });
      return;
    }
    setConfirmingId(appointmentId);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('appointments-confirm', {
        body: {
          appointment_id: appointmentId,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined,
      });

      if (error) throw error;

      toast({
        title: "Proposal confirmed",
        description: "The proposed time has been confirmed and the homeowner has been notified.",
      });

      await fetchAppointments();
    } catch (error: any) {
      console.error("Error confirming proposal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to confirm proposal",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      requested_by_homeowner: {
        label: "Pending Assignment",
        variant: "secondary",
        icon: AlertCircle,
      },
      sent_to_sub: {
        label: "Awaiting Response",
        variant: "outline",
        icon: Clock,
      },
      sub_countered: {
        label: "Counter Proposed",
        variant: "default",
        icon: AlertCircle,
      },
    };

    const item = config[status] || { label: status, variant: "outline" as const, icon: AlertCircle };
    const Icon = item.icon;

    return (
      <Badge variant={item.variant} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {item.label}
      </Badge>
    );
  };

  const pendingAssignments = appointments.filter(a => a.status === "requested_by_homeowner");
  const awaitingResponse = appointments.filter(a => a.status === "sent_to_sub");
  const counterProposed = appointments.filter(a => a.status === "sub_countered");

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
            <div>
              <h1 className="text-2xl font-bold text-foreground">Appointment Requests</h1>
              <p className="text-sm text-muted-foreground">
                Manage homeowner site visit requests and confirmations
              </p>
            </div>
            <Badge variant="outline" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              {appointments.length} Active Request{appointments.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="awaiting" className="gap-2">
              <Clock className="h-4 w-4" />
              Awaiting Response ({awaitingResponse.length})
            </TabsTrigger>
            <TabsTrigger value="countered" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Counter Proposals ({counterProposed.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Assignments Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground text-center">
                    No pending appointment requests to assign.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingAssignments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          {appointment.purpose}
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Home className="h-3.5 w-3.5" />
                            {appointment.project?.project_name} - {appointment.project?.client_name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {appointment.project?.location}
                          </div>
                          {appointment.homeowner && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {appointment.homeowner.full_name}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Requested Time */}
                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Requested Time
                        </div>
                        <div className="text-base font-semibold">
                          {format(new Date(appointment.requested_start), "EEEE, MMMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(appointment.requested_start), "h:mm a")}
                          {appointment.requested_end && ` - ${format(new Date(appointment.requested_end), "h:mm a")}`}
                        </div>
                      </div>
                    </div>

                    {/* Homeowner Note */}
                    {appointment.homeowner_note && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Homeowner Note:</div>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {appointment.homeowner_note}
                        </div>
                      </div>
                    )}

                    {/* Forward Card */}
                    <ForwardAppointmentCard
                      appointment={appointment}
                      projectId={appointment.project_id}
                      onForward={fetchAppointments}
                    />

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Requested on {format(new Date(appointment.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Awaiting Response Tab */}
          <TabsContent value="awaiting" className="space-y-4">
            {awaitingResponse.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Responses</h3>
                  <p className="text-muted-foreground text-center">
                    All forwarded requests have been responded to.
                  </p>
                </CardContent>
              </Card>
            ) : (
              awaitingResponse.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          {appointment.purpose}
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Home className="h-3.5 w-3.5" />
                            {appointment.project?.project_name}
                          </div>
                          {appointment.foreman && (
                            <div className="flex items-center gap-1.5 text-primary">
                              <User className="h-3.5 w-3.5" />
                              Assigned to: {appointment.foreman.full_name} ({appointment.forwarded_to_role})
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Requested Time
                        </div>
                        <div className="text-base font-semibold">
                          {format(new Date(appointment.requested_start), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="text-sm text-yellow-900 dark:text-yellow-100">
                        Waiting for {appointment.foreman?.full_name || "contractor"} to accept or propose alternative time.
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Forwarded on {format(new Date(appointment.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Counter Proposals Tab */}
          <TabsContent value="countered" className="space-y-4">
            {counterProposed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Counter Proposals</h3>
                  <p className="text-muted-foreground text-center">
                    There are no counter-proposed times awaiting your confirmation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              counterProposed.map((appointment) => (
                <Card key={appointment.id} className="border-orange-200 dark:border-orange-900">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          {appointment.purpose}
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Home className="h-3.5 w-3.5" />
                            {appointment.project?.project_name}
                          </div>
                          {appointment.foreman && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {appointment.foreman.full_name} ({appointment.forwarded_to_role})
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Original Request */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Original Request:</div>
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          {format(new Date(appointment.requested_start), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>

                    {/* Proposed Alternative */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Proposed Alternative:</div>
                      <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg border-2 border-primary">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="text-base font-semibold">
                            {format(new Date(appointment.proposed_start!), "EEEE, MMMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {format(new Date(appointment.proposed_start!), "h:mm a")}
                            {appointment.proposed_end && ` - ${format(new Date(appointment.proposed_end), "h:mm a")}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contractor Note */}
                    {appointment.sub_note && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Contractor Note:</div>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {appointment.sub_note}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => handleConfirmProposal(appointment.id)}
                      disabled={confirmingId === appointment.id}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5" />
                      {confirmingId === appointment.id ? "Confirming..." : "Confirm Proposed Time"}
                    </Button>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Proposed on {format(new Date(appointment.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

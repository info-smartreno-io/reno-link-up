import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SubAppointmentConfirmation } from "@/components/contractor/SubAppointmentConfirmation";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/hooks/demo/useDemoMode";
import { getDemoSubcontractorAppointments } from "@/utils/demoContractorData";

export default function SubcontractorAppointments() {
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  // Fetch appointments where user is forwarded_to
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["subcontractor-appointments", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getDemoSubcontractorAppointments();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use raw query to bypass type issues
      const { data, error } = await supabase
        .from("project_appointments" as any)
        .select("*, contractor_projects(*)" as any)
        .eq("forwarded_to_user_id", user.id)
        .order("requested_start", { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const pendingAppointments = appointments?.filter(
    (a) => a.status === "sent_to_sub" || a.status === "sub_countered"
  ) || [];

  const confirmedAppointments = appointments?.filter(
    (a) => a.status === "confirmed"
  ) || [];

  const handleAction = () => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Appointment action simulated successfully",
      });
      return;
    }
    refetch();
    toast({
      title: "Success",
      description: "Appointment updated successfully",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      sent_to_sub: { variant: "default", label: "Needs Response" },
      sub_countered: { variant: "secondary", label: "Counter Proposed" },
      confirmed: { variant: "outline", label: "Confirmed" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading appointments...</div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Site Visit Appointments</h1>
          <p className="text-muted-foreground mt-2">
            Manage homeowner visit requests and view your confirmed schedule
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending Confirmations
              {pendingAppointments.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed Visits
              {confirmedAppointments.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {confirmedAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No pending appointment requests
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    New homeowner visit requests will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {appointment.contractor_projects?.project_name || "Project"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {appointment.contractor_projects?.client_name}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Location</div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.contractor_projects?.location || "Not specified"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Purpose</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {appointment.purpose?.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 md:col-span-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Requested Time</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(appointment.requested_start)}
                            {appointment.requested_end && 
                              ` - ${format(new Date(appointment.requested_end), "h:mm a")}`
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {appointment.homeowner_note && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="font-medium mb-1 text-sm">Homeowner Note:</div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.homeowner_note}
                        </p>
                      </div>
                    )}

                    {appointment.pm_note && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="font-medium mb-1 text-sm">PM Note:</div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.pm_note}
                        </p>
                      </div>
                    )}

                    {appointment.status === "sub_countered" && appointment.proposed_start && (
                      <div className="bg-accent/50 p-4 rounded-lg border border-accent">
                        <div className="font-medium mb-1 text-sm">Your Proposed Time:</div>
                        <p className="text-sm">
                          {formatDateTime(appointment.proposed_start)}
                          {appointment.proposed_end && 
                            ` - ${format(new Date(appointment.proposed_end), "h:mm a")}`
                          }
                        </p>
                        {appointment.sub_note && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Note: {appointment.sub_note}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Waiting for PM confirmation
                        </p>
                      </div>
                    )}

                    <SubAppointmentConfirmation 
                      appointment={appointment} 
                      onAction={handleAction}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4 mt-6">
            {confirmedAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No confirmed visits scheduled
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Confirmed site visits will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {confirmedAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {appointment.contractor_projects?.project_name || "Project"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {appointment.contractor_projects?.client_name}
                          </p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 text-lg font-semibold">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          {formatDateTime(appointment.final_start)}
                          {appointment.final_end && 
                            ` - ${format(new Date(appointment.final_end), "h:mm a")}`
                          }
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Location</div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.contractor_projects?.location || "Not specified"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Purpose</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {appointment.purpose?.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>

                      {appointment.pm_note && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="font-medium mb-1 text-xs">PM Note:</div>
                          <p className="text-sm text-muted-foreground">
                            {appointment.pm_note}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ContractorLayout>
  );
}
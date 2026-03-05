import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoSimplePMAppointments } from "@/utils/demoContractorData";
import { useToast } from "@/hooks/use-toast";

export default function PMAppointments() {
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();
  
  // Use demo data in demo mode
  const appointments = isDemoMode ? getDemoSimplePMAppointments() : [];

  const handleConfirm = (appointmentId: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Appointment confirmed (demo action)",
      });
      return;
    }
    // Real implementation would go here
  };

  const handleReschedule = (appointmentId: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Reschedule dialog would open (demo action)",
      });
      return;
    }
    // Real implementation would go here
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">PM Appointment Requests</h1>
          <p className="text-muted-foreground">Manage project manager appointments and site visits</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(a => a.status === "confirmed").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments.filter(a => a.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Schedule and manage PM appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No appointments scheduled
              </div>
            ) : (
              appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{appointment.project}</CardTitle>
                        <CardDescription>{appointment.type}</CardDescription>
                      </div>
                      <Badge variant={appointment.status === "confirmed" ? "default" : "outline"}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.location}</span>
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleConfirm(appointment.id)}>Confirm</Button>
                          <Button size="sm" variant="outline" onClick={() => handleReschedule(appointment.id)}>Reschedule</Button>
                        </>
                      )}
                      {appointment.status === "confirmed" && (
                        <Button size="sm" variant="outline">View Details</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ContractorLayout>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoLeads, getDemoCallLogs, getDemoAppointments } from "@/utils/demoContractorData";
import { VoiceNoteRecorder } from "@/components/VoiceNoteRecorder";
import { TeamChat } from "@/components/TeamChat";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Phone,
  PhoneCall,
  Calendar,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  project_type?: string;
  last_contact?: string;
  notes?: string;
}

interface CallLog {
  id: string;
  lead_id: string | null;
  from_number: string;
  duration_seconds: number | null;
  disposition: string;
  notes: string | null;
  created_at: string;
  call_status: string;
  lead?: { name: string } | null;
}

interface Appointment {
  id: string;
  lead_id: string;
  scheduled_at: string;
  appointment_type: string;
  status: string;
  notes: string | null;
  lead?: { name: string } | null;
}

// Valid lead statuses from the database
const VALID_LEAD_STATUSES = [
  "new", 
  "new_lead", 
  "call_24h", 
  "contacted", 
  "qualified",
  "walkthrough_scheduled",
  "estimate_sent"
];

export default function InsideSales() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [voiceNoteDialogOpen, setVoiceNoteDialogOpen] = useState(false);
  const [currentVoiceNoteLead, setCurrentVoiceNoteLead] = useState<Lead | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalCalls: 0,
    callsToday: 0,
    appointmentsSet: 0,
    conversionRate: 0,
  });

  // Call form with disposition options matching database schema
  const [callForm, setCallForm] = useState({
    duration: "",
    disposition: "completed" as string,
    notes: "",
  });

  // Appointment form
  const [appointmentForm, setAppointmentForm] = useState({
    scheduled_at: "",
    type: "consultation",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [isDemoMode]);

  const fetchData = async () => {
    // Demo mode - use demo data
    if (isDemoMode) {
      const demoLeads = getDemoLeads();
      const demoCallLogs = getDemoCallLogs();
      const demoAppointments = getDemoAppointments();
      
      setLeads(demoLeads.map(lead => ({
        ...lead,
        last_contact: lead.updated_at,
        notes: lead.internal_notes || ""
      })));
      setCallLogs(demoCallLogs);
      setAppointments(demoAppointments);
      setStats({
        totalCalls: demoCallLogs.length,
        callsToday: 3,
        appointmentsSet: demoAppointments.filter(a => a.status === 'scheduled').length,
        conversionRate: 24,
      });
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch inbound leads with correct status filters
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .in("status", VALID_LEAD_STATUSES)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;
      setLeads((leadsData || []).map(lead => ({
        ...lead,
        last_contact: lead.updated_at,
        notes: lead.client_notes || lead.internal_notes || ""
      })));

      // Fetch call logs from database
      const { data: callLogsData, error: callLogsError } = await supabase
        .from("call_logs")
        .select("*, lead:leads(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (callLogsError) {
        console.error("Error fetching call logs:", callLogsError);
      } else {
        setCallLogs(callLogsData || []);
      }

      // Fetch appointments from database
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("inside_sales_appointments")
        .select("*, lead:leads(name)")
        .order("scheduled_at", { ascending: false })
        .limit(100);

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
      } else {
        setAppointments(appointmentsData || []);
      }

      // Calculate real stats from database
      await calculateStats();

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load inside sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get total calls
      const { count: totalCalls } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true });

      // Get calls today
      const { count: callsToday } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayISO);

      // Get appointments set (scheduled status)
      const { count: appointmentsSet } = await supabase
        .from("inside_sales_appointments")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled");

      // Calculate conversion rate (appointments / leads with calls)
      const { count: leadsWithCalls } = await supabase
        .from("call_logs")
        .select("lead_id", { count: "exact", head: true })
        .not("lead_id", "is", null);

      const conversionRate = leadsWithCalls && leadsWithCalls > 0 
        ? Math.round(((appointmentsSet || 0) / leadsWithCalls) * 100) 
        : 0;

      setStats({
        totalCalls: totalCalls || 0,
        callsToday: callsToday || 0,
        appointmentsSet: appointmentsSet || 0,
        conversionRate,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const handleVoiceNoteComplete = async (transcription: string, lead: Lead) => {
    try {
      const currentNotes = lead.notes || '';
      const timestamp = new Date().toLocaleString();
      const newNotes = `${currentNotes}\n\n[Voice Note - ${timestamp}]\n${transcription}`.trim();

      await supabase
        .from('leads')
        .update({ 
          internal_notes: newNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      // Also save as a lead note in the new table
      await supabase
        .from('lead_notes')
        .insert({
          lead_id: lead.id,
          note_text: `[Voice Note]\n${transcription}`,
          is_internal: true,
        });

      toast({
        title: "Voice Note Added",
        description: "Transcription saved to lead notes",
      });

      fetchData();
    } catch (error) {
      console.error('Error saving voice note:', error);
      toast({
        title: "Error",
        description: "Failed to save voice note",
        variant: "destructive",
      });
    }
  };

  const handleLogCall = async () => {
    if (!selectedLead) return;

    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Call logged (not saved in demo)" });
      setCallDialogOpen(false);
      setCallForm({ duration: "", disposition: "completed", notes: "" });
      return;
    }

    try {
      // Insert call log into database
      const { error: insertError } = await supabase
        .from("call_logs")
        .insert({
          lead_id: selectedLead.id,
          from_number: selectedLead.phone || "unknown",
          duration_seconds: parseInt(callForm.duration) * 60 || 0,
          disposition: callForm.disposition,
          notes: callForm.notes,
          call_status: "completed",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
      
      // Update lead status
      await supabase
        .from("leads")
        .update({ 
          status: "contacted",
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedLead.id);

      toast({
        title: "Call Logged",
        description: "Call activity has been recorded",
      });

      setCallDialogOpen(false);
      setCallForm({ duration: "", disposition: "completed", notes: "" });
      fetchData();
    } catch (error) {
      console.error("Error logging call:", error);
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive",
      });
    }
  };

  const handleScheduleAppointment = async () => {
    if (!selectedLead) return;

    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Appointment scheduled (not saved in demo)" });
      setAppointmentDialogOpen(false);
      setAppointmentForm({ scheduled_at: "", type: "consultation", notes: "" });
      return;
    }

    try {
      // Insert appointment into database
      const { error: insertError } = await supabase
        .from("inside_sales_appointments")
        .insert({
          lead_id: selectedLead.id,
          scheduled_at: new Date(appointmentForm.scheduled_at).toISOString(),
          appointment_type: appointmentForm.type,
          status: "scheduled",
          notes: appointmentForm.notes,
        });

      if (insertError) throw insertError;

      // Update lead status
      await supabase
        .from("leads")
        .update({ status: "walkthrough_scheduled" })
        .eq("id", selectedLead.id);

      toast({
        title: "Appointment Scheduled",
        description: `Appointment set for ${new Date(appointmentForm.scheduled_at).toLocaleString()}`,
      });

      setAppointmentDialogOpen(false);
      setAppointmentForm({ scheduled_at: "", type: "consultation", notes: "" });
      fetchData();
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
      case "new_lead":
        return "default";
      case "call_24h":
        return "destructive";
      case "contacted":
        return "secondary";
      case "qualified":
      case "walkthrough_scheduled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "new_lead":
        return "New Lead";
      case "call_24h":
        return "Call in 24h";
      case "walkthrough_scheduled":
        return "Scheduled";
      case "estimate_sent":
        return "Estimate Sent";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };

  return (
    <ContractorLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inside Sales Dashboard</h1>
            <p className="text-muted-foreground">Manage inbound leads and schedule appointments</p>
          </div>
          <Button onClick={() => navigate("/estimator/leads")} variant="outline">
            <Target className="mr-2 h-4 w-4" />
            View All Leads
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">{stats.totalCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <PhoneCall className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Calls Today</p>
                  <p className="text-2xl font-bold">{stats.callsToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appointments Set</p>
                  <p className="text-2xl font-bold">{stats.appointmentsSet}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">Inbound Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="calls">Call Log ({callLogs.length})</TabsTrigger>
            <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inbound Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading leads...</div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No inbound leads at this time
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Project Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{lead.email}</div>
                              <div className="text-muted-foreground">{lead.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(lead.status)}>
                              {formatStatusLabel(lead.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{lead.project_type || "Direct"}</TableCell>
                          <TableCell>
                            {new Date(lead.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog open={callDialogOpen && selectedLead?.id === lead.id} onOpenChange={setCallDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedLead(lead)}
                                  >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Log Call
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Log Call - {lead.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Duration (minutes)</Label>
                                      <Input
                                        type="number"
                                        value={callForm.duration}
                                        onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                                        placeholder="5"
                                      />
                                    </div>
                                    <div>
                                      <Label>Disposition</Label>
                                      <Select value={callForm.disposition} onValueChange={(value) => setCallForm({ ...callForm, disposition: value })}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="qualified_booked">Qualified - Booked</SelectItem>
                                          <SelectItem value="qualified_follow_up">Qualified - Follow Up</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                          <SelectItem value="not_a_fit">Not a Fit</SelectItem>
                                          <SelectItem value="existing_customer">Existing Customer</SelectItem>
                                          <SelectItem value="voicemail">Voicemail</SelectItem>
                                          <SelectItem value="missed">Missed</SelectItem>
                                          <SelectItem value="vendor_other">Vendor/Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={callForm.notes}
                                        onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                                        placeholder="Call notes..."
                                        rows={4}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setCallDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleLogCall}>Log Call</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={appointmentDialogOpen && selectedLead?.id === lead.id} onOpenChange={setAppointmentDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedLead(lead)}
                                  >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Schedule
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Schedule Appointment - {lead.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Date & Time</Label>
                                      <Input
                                        type="datetime-local"
                                        value={appointmentForm.scheduled_at}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, scheduled_at: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Appointment Type</Label>
                                      <Select value={appointmentForm.type} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, type: value })}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="consultation">Consultation</SelectItem>
                                          <SelectItem value="walkthrough">Walkthrough</SelectItem>
                                          <SelectItem value="estimate">Estimate Review</SelectItem>
                                          <SelectItem value="follow-up">Follow-up</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={appointmentForm.notes}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                        placeholder="Appointment notes..."
                                        rows={4}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setAppointmentDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleScheduleAppointment}>Schedule</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                {callLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No call logs yet. Start logging calls from the leads tab.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Disposition</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.lead?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.from_number}
                          </TableCell>
                          <TableCell>
                            {log.duration_seconds ? Math.round(log.duration_seconds / 60) : 0} min
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.disposition === "qualified_booked" ? "default" : "secondary"}>
                              {log.disposition.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{log.notes || "-"}</TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments scheduled yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">
                            {apt.lead?.name || "Unknown"}
                          </TableCell>
                          <TableCell className="capitalize">{apt.appointment_type}</TableCell>
                          <TableCell>
                            {new Date(apt.scheduled_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={apt.status === "scheduled" ? "default" : "secondary"}>
                              {apt.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{apt.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Voice Note Recorder */}
        <VoiceNoteRecorder
          open={voiceNoteDialogOpen}
          onClose={() => {
            setVoiceNoteDialogOpen(false);
            setCurrentVoiceNoteLead(null);
          }}
          onTranscriptionComplete={(transcription) => {
            if (currentVoiceNoteLead) {
              handleVoiceNoteComplete(transcription, currentVoiceNoteLead);
            }
          }}
          title={`Voice Note - ${currentVoiceNoteLead?.name || 'Lead'}`}
        />

        {/* Team Chat */}
        <TeamChat />
      </div>
    </ContractorLayout>
  );
}

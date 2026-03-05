import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  HardHat, 
  CheckCircle,
  Camera,
  Phone,
  MessageSquare,
  Package,
  Clock,
  MapPin,
  Send,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { PortalCopilot } from "@/components/ai/PortalCopilot";

interface CheckIn {
  id: string;
  check_in_time: string;
  check_in_location: string | null;
  check_in_notes: string | null;
}

interface EODReport {
  id: string;
  report_date: string;
  work_completed: string;
  photo_urls: string[];
  video_urls: string[];
  crew_members: string[] | null;
  hours_worked: number | null;
  weather_conditions: string | null;
}

interface MaterialRequest {
  id: string;
  material_name: string;
  quantity: string;
  urgency: "urgent" | "normal" | "low";
  notes: string | null;
  status: string;
  requested_date: string;
  needed_by_date: string | null;
}

interface ProjectMessage {
  id: string;
  sender_id: string;
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

export default function ContractorForemanPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [eodDialogOpen, setEodDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check-in form
  const [checkInLocation, setCheckInLocation] = useState("");
  const [checkInNotes, setCheckInNotes] = useState("");

  // EOD Report form
  const [workCompleted, setWorkCompleted] = useState("");
  const [crewMembers, setCrewMembers] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [weatherConditions, setWeatherConditions] = useState("");

  // Material request form
  const [materialName, setMaterialName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [urgency, setUrgency] = useState<"urgent" | "normal" | "low">("normal");
  const [materialNotes, setMaterialNotes] = useState("");
  const [neededByDate, setNeededByDate] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Check if it's 3:30 PM and show notification
      const hours = new Date().getHours();
      const minutes = new Date().getMinutes();
      if (hours === 15 && minutes === 30) {
        showEODReminder();
      }
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (userId) {
      // Set up realtime subscriptions
      const messagesChannel = supabase
        .channel('project-messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_messages',
            filter: `receiver_id=eq.${userId}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      const requestsChannel = supabase
        .channel('material-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'material_requests',
            filter: `requested_by=eq.${userId}`
          },
          () => {
            fetchMaterialRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(requestsChannel);
      };
    }
  }, [userId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/contractor/auth");
      return;
    }
    
    setUserId(session.user.id);
    await Promise.all([
      checkTodayCheckIn(session.user.id),
      fetchMessages(),
      fetchMaterialRequests()
    ]);
    setLoading(false);
  };

  const checkTodayCheckIn = async (uid: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_checkins' as any)
        .select('*')
        .eq('foreman_id', uid)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTodayCheckIn(data as unknown as CheckIn);
    } catch (error) {
      console.error('Error checking check-in:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('project_messages' as any)
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages((data || []) as unknown as ProjectMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMaterialRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('material_requests' as any)
        .select('*')
        .eq('requested_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterialRequests((data || []) as unknown as MaterialRequest[]);
    } catch (error) {
      console.error('Error fetching material requests:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('daily_checkins' as any)
        .insert({
          foreman_id: userId,
          contractor_id: userId, // Update when multi-user is implemented
          check_in_location: checkInLocation,
          check_in_notes: checkInNotes,
        });

      if (error) throw error;

      toast.success('Checked in successfully!');
      setCheckInDialogOpen(false);
      setCheckInLocation("");
      setCheckInNotes("");
      checkTodayCheckIn(userId);
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
    }
  };

  const handleEODReport = async () => {
    if (!workCompleted || !userId) return;

    try {
      const { error } = await supabase
        .from('end_of_day_reports' as any)
        .insert({
          foreman_id: userId,
          contractor_id: userId,
          work_completed: workCompleted,
          crew_members: crewMembers ? crewMembers.split(',').map(m => m.trim()) : null,
          hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
          weather_conditions: weatherConditions,
        });

      if (error) throw error;

      toast.success('End of day report submitted!');
      setEodDialogOpen(false);
      setWorkCompleted("");
      setCrewMembers("");
      setHoursWorked("");
      setWeatherConditions("");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  const handleMaterialRequest = async () => {
    if (!materialName || !quantity || !userId) return;

    try {
      const { error } = await supabase
        .from('material_requests' as any)
        .insert({
          requested_by: userId,
          contractor_id: userId,
          material_name: materialName,
          quantity,
          urgency,
          notes: materialNotes,
          needed_by_date: neededByDate || null,
        });

      if (error) throw error;

      toast.success('Material request submitted!');
      setMaterialDialogOpen(false);
      setMaterialName("");
      setQuantity("");
      setUrgency("normal");
      setMaterialNotes("");
      setNeededByDate("");
      fetchMaterialRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    }
  };

  const sendMessage = async () => {
    if (!newMessage || !userId) return;

    try {
      const { error } = await supabase
        .from('project_messages' as any)
        .insert({
          sender_id: userId,
          message: newMessage,
          message_type: 'text',
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const showEODReminder = () => {
    if (!todayCheckIn) return; // Only show if checked in today
    
    toast("End of Day Report", {
      description: "It's 3:30 PM - Time to submit your daily report with photos/videos!",
      action: {
        label: "Submit Report",
        onClick: () => setEodDialogOpen(true),
      },
      duration: 10000,
    });
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HardHat className="h-8 w-8 text-primary" />
              Foreman Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentTime.toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {todayCheckIn ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <MapPin className="h-5 w-5 text-primary" />
                    )}
                    Daily Check-In
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayCheckIn ? (
                    <Badge variant="outline" className="bg-green-50">
                      Checked in at {new Date(todayCheckIn.check_in_time).toLocaleTimeString()}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Tap to check in when you arrive</p>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Check In to Job Site</DialogTitle>
                <DialogDescription>Let your PM know you've arrived</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Job site address"
                    value={checkInLocation}
                    onChange={(e) => setCheckInLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Any notes for the PM..."
                    value={checkInNotes}
                    onChange={(e) => setCheckInNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCheckIn}>Check In</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={eodDialogOpen} onOpenChange={setEodDialogOpen}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    End of Day Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {currentTime.getHours() >= 15 && currentTime.getHours() < 18 ? (
                      <span className="flex items-center gap-2 text-orange-600">
                        <Bell className="h-4 w-4" />
                        Time to submit today's report
                      </span>
                    ) : (
                      "Submit progress & photos"
                    )}
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>End of Day Report</DialogTitle>
                <DialogDescription>Document today's progress and request materials</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Work Completed Today *</Label>
                  <Textarea
                    placeholder="Describe what was accomplished today..."
                    value={workCompleted}
                    onChange={(e) => setWorkCompleted(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Crew Members</Label>
                    <Input
                      placeholder="John, Mike, Sarah"
                      value={crewMembers}
                      onChange={(e) => setCrewMembers(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Hours Worked</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weather Conditions</Label>
                  <Input
                    placeholder="Clear, 65°F"
                    value={weatherConditions}
                    onChange={(e) => setWeatherConditions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Photos & Videos</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Take photos/videos of today's work</p>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Media
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEodDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEODReport}>Submit Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Material Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {materialRequests.filter(r => r.status === 'pending').length} pending requests
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Materials</DialogTitle>
                <DialogDescription>Submit a material order request</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Material Name *</Label>
                  <Input
                    placeholder="e.g., 2x4 lumber"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      placeholder="e.g., 50 pieces"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Urgency</Label>
                    <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Needed By Date</Label>
                  <Input
                    type="date"
                    value={neededByDate}
                    onChange={(e) => setNeededByDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional details..."
                    value={materialNotes}
                    onChange={(e) => setMaterialNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleMaterialRequest}>Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Messages Section */}
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="requests">Material Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Project Manager Communication
                </CardTitle>
                <CardDescription>Message or call your PM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Call PM
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Call
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.sender_id === userId ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {materialRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No material requests yet
                </CardContent>
              </Card>
            ) : (
              materialRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.material_name}</CardTitle>
                        <CardDescription>Quantity: {request.quantity}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={
                          request.urgency === 'urgent' ? 'destructive' :
                          request.urgency === 'normal' ? 'default' : 'secondary'
                        }>
                          {request.urgency}
                        </Badge>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {request.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested: {new Date(request.requested_date).toLocaleDateString()}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Copilot */}
      <PortalCopilot 
        role="foreman" 
        userId={userId}
        contextData={{ checkedIn: !!todayCheckIn }}
      />
    </ContractorLayout>
  );
}

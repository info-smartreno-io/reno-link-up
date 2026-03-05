import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRouteOptimization } from "@/hooks/useRouteOptimization";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoLeads, getDemoFieldVisits } from "@/utils/demoContractorData";
import { VoiceNoteRecorder } from "@/components/VoiceNoteRecorder";
import { TeamChat } from "@/components/TeamChat";
import { LeadsMap } from "@/components/contractor/LeadsMap";
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
  MapPin,
  Calendar,
  Route,
  TrendingUp,
  Target,
  DollarSign,
  Navigation,
  Wifi,
  WifiOff,
  MapPinned,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Voicemail,
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
  location: string;
  created_at: string;
  last_contact?: string;
  notes?: string;
}

interface FieldVisit {
  id: string;
  lead_id: string;
  lead_name: string;
  address: string;
  scheduled_at: string;
  status: string;
  outcome: string;
  notes: string;
}

export default function OutsideSales() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isDemoMode } = useDemoMode();
  const { isOnline, saveLocally, getAllLocally, queueUpdate, getPendingUpdates, clearPendingUpdate } = useOfflineSync();
  const { latitude, longitude, accuracy, getCurrentLocation } = useGeolocation(true);
  const { optimizedRoute, isOptimizing, optimize, clearRoute } = useRouteOptimization();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fieldVisits, setFieldVisits] = useState<FieldVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [quickUpdateLead, setQuickUpdateLead] = useState<Lead | null>(null);
  const [selectedLeadsForRoute, setSelectedLeadsForRoute] = useState<string[]>([]);
  const [voiceNoteDialogOpen, setVoiceNoteDialogOpen] = useState(false);
  const [currentVoiceNoteLead, setCurrentVoiceNoteLead] = useState<Lead | null>(null);


  const [stats, setStats] = useState({
    totalVisits: 0,
    visitsToday: 0,
    conversionRate: 0,
    avgDealSize: 0,
  });

  const [visitForm, setVisitForm] = useState({
    scheduled_at: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [isDemoMode]);

  useEffect(() => {
    if (isOnline && !isDemoMode) {
      syncPendingUpdates();
    }
  }, [isOnline, isDemoMode]);

    const syncPendingUpdates = async () => {
    const pending = await getPendingUpdates();
    
    for (const update of pending) {
      try {
        if (update.type === 'lead') {
          if (update.action === 'update') {
            await supabase
              .from('leads')
              .update(update.data)
              .eq('id', update.data.id);
          }
        }
        await clearPendingUpdate(update.id);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
    
    if (pending.length > 0) {
      toast({
        title: "Synced",
        description: `${pending.length} updates synced successfully`,
      });
      fetchData();
    }
  };

  const fetchData = async () => {
    // Demo mode - use demo data
    if (isDemoMode) {
      const demoLeads = getDemoLeads();
      const demoVisits = getDemoFieldVisits();
      
      setLeads(demoLeads.map(lead => ({
        ...lead,
        last_contact: lead.updated_at,
        notes: lead.internal_notes || ""
      })));
      setFieldVisits(demoVisits);
      setStats({
        totalVisits: demoVisits.length,
        visitsToday: 2,
        conversionRate: 32,
        avgDealSize: 45000,
      });
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .in("status", ["new", "contacted", "qualified"])
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;
      const mappedLeads = (leadsData || []).map(lead => ({
        ...lead,
        last_contact: lead.updated_at,
        notes: lead.client_notes || lead.internal_notes || ""
      }));
      
      setLeads(mappedLeads);
      
      // Cache locally for offline use
      for (const lead of mappedLeads) {
        await saveLocally('leads', lead);
      }

      setStats({
        totalVisits: 0,
        visitsToday: 0,
        conversionRate: 0,
        avgDealSize: 0,
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      
      // Load from local storage if offline
      if (!isOnline) {
        const localLeads = await getAllLocally('leads');
        setLeads(localLeads);
        toast({
          title: "Offline Mode",
          description: "Showing cached data. Updates will sync when online.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load outside sales data",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLeadUpdate = async (leadId: string, status: string, notes?: string) => {
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Lead updated (not saved in demo)" });
      setQuickUpdateLead(null);
      return;
    }

    const updateData = {
      id: leadId,
      status,
      ...(notes && { internal_notes: notes }),
      updated_at: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        await supabase
          .from('leads')
          .update(updateData)
          .eq('id', leadId);
        
        toast({
          title: "Lead Updated",
          description: "Lead status updated successfully",
        });
      } else {
        await queueUpdate('lead', 'update', updateData);
        toast({
          title: "Queued for Sync",
          description: "Update will sync when you're back online",
        });
      }
      
      setQuickUpdateLead(null);
      fetchData();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const handleScheduleVisit = async () => {
    if (!selectedLead) return;

    const gpsCoordinates = latitude && longitude ? `${latitude},${longitude}` : null;
    
    const newVisit: FieldVisit = {
      id: `temp-${Date.now()}`,
      lead_id: selectedLead.id,
      lead_name: selectedLead.name,
      address: visitForm.address,
      scheduled_at: visitForm.scheduled_at,
      status: "scheduled",
      outcome: "",
      notes: `${visitForm.notes}${gpsCoordinates ? `\nGPS: ${gpsCoordinates}` : ''}`,
    };

    try {
      if (isOnline) {
        setFieldVisits([newVisit, ...fieldVisits]);

        await supabase
          .from("leads")
          .update({ status: "contacted" })
          .eq("id", selectedLead.id);

        toast({
          title: "Visit Scheduled",
          description: `Field visit set for ${new Date(visitForm.scheduled_at).toLocaleString()}`,
        });
      } else {
        await queueUpdate('visit', 'create', newVisit);
        await queueUpdate('lead', 'update', { id: selectedLead.id, status: 'contacted' });
        
        toast({
          title: "Queued for Sync",
          description: "Visit will be created when you're back online",
        });
      }

      setVisitDialogOpen(false);
      setVisitForm({ scheduled_at: "", address: "", notes: "" });
      fetchData();
    } catch (error) {
      console.error("Error scheduling visit:", error);
      toast({
        title: "Error",
        description: "Failed to schedule visit",
        variant: "destructive",
      });
    }
  };

  const handleOptimizeRoute = async () => {
    if (!latitude || !longitude) {
      toast({
        title: "Location Required",
        description: "Please enable location services to optimize route",
        variant: "destructive",
      });
      return;
    }

    const selectedLocations = leads
      .filter((lead) => selectedLeadsForRoute.includes(lead.id))
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        address: lead.location,
      }));

    if (selectedLocations.length < 2) {
      toast({
        title: "Select Leads",
        description: "Please select at least 2 leads to optimize route",
        variant: "destructive",
      });
      return;
    }

    await optimize(selectedLocations, latitude, longitude);
    
    toast({
      title: "Route Optimized",
      description: `Optimized route for ${selectedLocations.length} stops`,
    });
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadsForRoute((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleVoiceNoteComplete = async (transcription: string, lead: Lead) => {
    try {
      const currentNotes = lead.notes || '';
      const timestamp = new Date().toLocaleString();
      const newNotes = `${currentNotes}\n\n[Voice Note - ${timestamp}]\n${transcription}`.trim();

      if (isOnline) {
        await supabase
          .from('leads')
          .update({ 
            internal_notes: newNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        toast({
          title: "Voice Note Added",
          description: "Transcription saved to lead notes",
        });
      } else {
        await queueUpdate('lead', 'update', {
          id: lead.id,
          internal_notes: newNotes,
          updated_at: new Date().toISOString()
        });

        toast({
          title: "Voice Note Queued",
          description: "Will sync when you're back online",
        });
      }

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


  // Mobile lead card component
  const MobileLeadCard = ({ lead }: { lead: Lead }) => {
    const isSelected = selectedLeadsForRoute.includes(lead.id);
    
    return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleLeadSelection(lead.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{lead.name}</h3>
                <Badge variant={lead.status === "new" ? "default" : "secondary"} className="mt-1">
                  {lead.status}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setQuickUpdateLead(lead)}
              variant="outline"
            >
              Update
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href={`tel:${lead.phone}`} className="hover:text-primary">
                {lead.phone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${lead.email}`} className="hover:text-primary truncate">
                {lead.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{lead.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{new Date(lead.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => setSelectedLead(lead)}
              className="flex-1"
            >
              <Navigation className="h-4 w-4 mr-1" />
              Schedule Visit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (latitude && longitude) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lead.location)}`, '_blank');
                } else {
                  toast({
                    title: "Location Required",
                    description: "Please enable location services",
                    variant: "destructive",
                  });
                }
              }}
            >
              <MapPinned className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <ContractorLayout>
      <div className={`${isMobile ? 'px-3' : 'max-w-7xl mx-auto'} space-y-4 pb-6`}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>
                {isMobile ? 'Field Sales' : 'Outside Sales Dashboard'}
              </h1>
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-orange-600" />
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {isOnline ? 'Online - Syncing enabled' : 'Offline - Changes will sync later'}
            </p>
            {latitude && longitude && (
              <p className="text-xs text-muted-foreground mt-1">
                <MapPinned className="h-3 w-3 inline mr-1" />
                GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)} ({accuracy?.toFixed(0)}m)
              </p>
            )}
          </div>
          {!isMobile && (
            <Button onClick={() => navigate("/estimator/leads")} variant="outline">
              <Target className="mr-2 h-4 w-4" />
              View All Leads
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'} gap-3`}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold">{stats.totalVisits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visits Today</p>
                  <p className="text-2xl font-bold">{stats.visitsToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                  <p className="text-2xl font-bold">${stats.avgDealSize.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">Territory Leads</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="visits">Field Visits</TabsTrigger>
            <TabsTrigger value="route">Route Planning</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Territory Map</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadsMap 
                  leads={leads} 
                  currentLocation={
                    latitude && longitude 
                      ? { lat: latitude, lng: longitude } 
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            {isMobile ? (
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">Loading leads...</div>
                ) : leads.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No territory leads at this time
                    </CardContent>
                  </Card>
                ) : (
                  leads.map((lead) => <MobileLeadCard key={lead.id} lead={lead} />)
                )}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Territory Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading leads...</div>
                  ) : leads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No territory leads at this time
                    </div>
                  ) : (
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
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
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{lead.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={lead.status === "new" ? "default" : "secondary"}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(lead.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Dialog open={visitDialogOpen && selectedLead?.id === lead.id} onOpenChange={setVisitDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedLead(lead)}
                                >
                                  <Navigation className="h-4 w-4 mr-1" />
                                  Schedule Visit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Schedule Field Visit - {lead.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Date & Time</Label>
                                    <Input
                                      type="datetime-local"
                                      value={visitForm.scheduled_at}
                                      onChange={(e) => setVisitForm({ ...visitForm, scheduled_at: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Address</Label>
                                    <Input
                                      value={visitForm.address}
                                      onChange={(e) => setVisitForm({ ...visitForm, address: e.target.value })}
                                      placeholder="Visit address..."
                                    />
                                  </div>
                                  <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                      value={visitForm.notes}
                                      onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                                      placeholder="Visit notes..."
                                      rows={4}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleScheduleVisit}>Schedule Visit</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="visits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Field Visits Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {fieldVisits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No field visits scheduled yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fieldVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell className="font-medium">{visit.lead_name}</TableCell>
                          <TableCell>{visit.address}</TableCell>
                          <TableCell>
                            {new Date(visit.scheduled_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={visit.status === "scheduled" ? "default" : "secondary"}>
                              {visit.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{visit.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Territory Map</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadsMap 
                  leads={leads} 
                  currentLocation={
                    latitude && longitude 
                      ? { lat: latitude, lng: longitude } 
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="route" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Route Planning</span>
                  {selectedLeadsForRoute.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLeadsForRoute([])}
                      >
                        Clear ({selectedLeadsForRoute.length})
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleOptimizeRoute}
                        disabled={isOptimizing}
                      >
                        <Route className="h-4 w-4 mr-2" />
                        {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!optimizedRoute ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">Select leads to optimize your route</p>
                    <p className="text-sm">
                      Check the boxes next to leads in the "Territory Leads" tab, then click "Optimize Route"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Total Stops</div>
                          <div className="text-2xl font-bold">{optimizedRoute.stops.length}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Total Distance</div>
                          <div className="text-2xl font-bold">
                            {optimizedRoute.totalDistance.toFixed(1)} km
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Est. Drive Time</div>
                          <div className="text-2xl font-bold">
                            {Math.round(optimizedRoute.totalDriveTime)} min
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Optimized Route</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const coords = optimizedRoute.stops
                              .map((stop) => `${stop.latitude},${stop.longitude}`)
                              .join('/');
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&waypoints=${coords}`,
                              '_blank'
                            );
                          }}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Open in Maps
                        </Button>
                      </div>

                      {optimizedRoute.stops.map((stop, index) => (
                        <Card key={stop.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                                {stop.order}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{stop.name}</h4>
                                <p className="text-sm text-muted-foreground">{stop.address}</p>
                                {index > 0 && stop.distanceFromPrevious && (
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span>
                                      📍 {stop.distanceFromPrevious.toFixed(1)} km from previous
                                    </span>
                                    <span>
                                      ⏱️ ~{Math.round(stop.estimatedDriveTime || 0)} min drive
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (stop.latitude && stop.longitude) {
                                    window.open(
                                      `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`,
                                      '_blank'
                                    );
                                  }
                                }}
                              >
                                <Navigation className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          clearRoute();
                          setSelectedLeadsForRoute([]);
                        }}
                      >
                        Clear Route
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Update Dialog */}
        <Dialog open={!!quickUpdateLead} onOpenChange={(open) => !open && setQuickUpdateLead(null)}>
          <DialogContent className={isMobile ? "max-w-[95vw]" : ""}>
            <DialogHeader>
              <DialogTitle>Quick Lead Update - {quickUpdateLead?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select
                  defaultValue={quickUpdateLead?.status}
                  onValueChange={(value) => {
                    if (quickUpdateLead) {
                      handleQuickLeadUpdate(quickUpdateLead.id, value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (quickUpdateLead) {
                      window.location.href = `tel:${quickUpdateLead.phone}`;
                    }
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (quickUpdateLead && latitude && longitude) {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(quickUpdateLead.location)}`, '_blank');
                    }
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Visit Schedule Dialog */}
        <Dialog open={visitDialogOpen && !!selectedLead} onOpenChange={setVisitDialogOpen}>
          <DialogContent className={isMobile ? "max-w-[95vw]" : ""}>
            <DialogHeader>
              <DialogTitle>Schedule Field Visit - {selectedLead?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={visitForm.scheduled_at}
                  onChange={(e) => setVisitForm({ ...visitForm, scheduled_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={visitForm.address}
                    onChange={(e) => setVisitForm({ ...visitForm, address: e.target.value })}
                    placeholder="Visit address..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={getCurrentLocation}
                    title="Use current location"
                  >
                    <MapPinned className="h-4 w-4" />
                  </Button>
                </div>
                {latitude && longitude && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                )}
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                  placeholder="Visit notes..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleVisit}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Schedule Visit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

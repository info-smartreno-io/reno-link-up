import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstimateWorkspace, useFieldModeRooms } from "@/hooks/useEstimateWorkspace";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, ArrowRight, Camera, MapPin } from "lucide-react";

const TRADE_NOTE_FIELDS = [
  { key: "demolition_notes", label: "Demolition" },
  { key: "framing_notes", label: "Framing" },
  { key: "electrical_notes", label: "Electrical" },
  { key: "plumbing_notes", label: "Plumbing" },
  { key: "hvac_notes", label: "HVAC" },
  { key: "flooring_notes", label: "Flooring" },
  { key: "cabinetry_notes", label: "Cabinetry" },
  { key: "finish_notes", label: "Finish Work" },
] as const;

export default function EstimatingFieldMode() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [newRoomName, setNewRoomName] = useState("");

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["lead-detail", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", leadId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { workspace, isLoading: wsLoading, createWorkspace, updateWorkspace } = useEstimateWorkspace(leadId);
  const { rooms, isLoading: roomsLoading, addRoom, updateRoom, deleteRoom } = useFieldModeRooms(workspace?.id);

  const [siteNotes, setSiteNotes] = useState("");
  const [generalConditions, setGeneralConditions] = useState({
    dumpster_location: "",
    staging_area: "",
    portable_toilet: false,
    parking_access: "",
    occupied_home: false,
    delivery_constraints: "",
    protection_requirements: "",
  });

  // Sync state when workspace loads
  const isInitialized = workspace && siteNotes === "" && workspace.site_notes;
  if (isInitialized) {
    setSiteNotes(workspace.site_notes || "");
    if (workspace.general_conditions && typeof workspace.general_conditions === 'object') {
      setGeneralConditions(prev => ({ ...prev, ...(workspace.general_conditions as any) }));
    }
  }

  if (leadLoading || wsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!lead) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-muted-foreground">Lead not found</div>
      </AdminLayout>
    );
  }

  // Auto-create workspace if missing
  if (!workspace) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-3xl mx-auto py-10">
          <Button variant="ghost" onClick={() => navigate("/admin/estimating")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Estimating Hub
          </Button>
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <MapPin className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Start Field Mode</h2>
              <p className="text-muted-foreground">Create a workspace for <strong>{lead.name}</strong> — {lead.project_type}</p>
              <Button onClick={() => createWorkspace.mutate()} disabled={createWorkspace.isPending}>
                {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const handleSaveSiteNotes = () => {
    updateWorkspace.mutate({ site_notes: siteNotes, general_conditions: generalConditions });
    toast.success("Site notes saved");
  };

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    addRoom.mutate(newRoomName.trim());
    setNewRoomName("");
  };

  const handleSendToBidPacket = () => {
    updateWorkspace.mutate({
      field_mode_status: "complete",
      bid_packet_status: "in_progress",
      status: "bid_packet_in_progress",
    });
    toast.success("Field mode complete — bid packet workspace ready");
    navigate(`/admin/estimating/${leadId}/bid-packet`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/estimating")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Field Mode: {lead.name}</h1>
              <p className="text-sm text-muted-foreground">{lead.project_type} • {lead.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{workspace.field_mode_status?.replace(/_/g, " ")}</Badge>
            <Button variant="outline" onClick={handleSaveSiteNotes} className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button onClick={handleSendToBidPacket} className="gap-2">
              Send to Bid Packet <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Site Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site Notes & First Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={siteNotes}
              onChange={(e) => setSiteNotes(e.target.value)}
              placeholder="Walkthrough summary, first impressions, access notes, special conditions..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* General Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General Conditions</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Dumpster Location</label>
              <Input value={generalConditions.dumpster_location} onChange={e => setGeneralConditions(p => ({ ...p, dumpster_location: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Staging Area</label>
              <Input value={generalConditions.staging_area} onChange={e => setGeneralConditions(p => ({ ...p, staging_area: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Parking / Access</label>
              <Input value={generalConditions.parking_access} onChange={e => setGeneralConditions(p => ({ ...p, parking_access: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Delivery Constraints</label>
              <Input value={generalConditions.delivery_constraints} onChange={e => setGeneralConditions(p => ({ ...p, delivery_constraints: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Protection Requirements</label>
              <Input value={generalConditions.protection_requirements} onChange={e => setGeneralConditions(p => ({ ...p, protection_requirements: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {/* Room / Area Entries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rooms / Areas ({rooms.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="New area name..."
                  className="w-48"
                  onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
                />
                <Button size="sm" onClick={handleAddRoom} disabled={!newRoomName.trim()} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : rooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No rooms/areas added yet. Add your first area above.</p>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {rooms.map((room) => (
                  <AccordionItem key={room.id} value={room.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{room.room_name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {/* Dimensions */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Dimensions (JSON)</label>
                        <Input
                          defaultValue={room.dimensions ? JSON.stringify(room.dimensions) : ""}
                          onBlur={(e) => {
                            try {
                              const dims = JSON.parse(e.target.value || "{}");
                              updateRoom.mutate({ roomId: room.id, updates: { dimensions: dims } });
                            } catch { /* skip invalid JSON */ }
                          }}
                          placeholder='{"length": 12, "width": 10, "height": 8}'
                        />
                      </div>

                      {/* Trade-specific notes */}
                      <div className="grid md:grid-cols-2 gap-3">
                        {TRADE_NOTE_FIELDS.map(({ key, label }) => (
                          <div key={key}>
                            <label className="text-xs text-muted-foreground">{label}</label>
                            <Textarea
                              defaultValue={(room as any)[key] || ""}
                              onBlur={(e) => updateRoom.mutate({ roomId: room.id, updates: { [key]: e.target.value } })}
                              placeholder={`${label} notes...`}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Hidden conditions */}
                      <div>
                        <label className="text-xs text-muted-foreground">Hidden Condition Concerns</label>
                        <Textarea
                          defaultValue={room.hidden_conditions || ""}
                          onBlur={(e) => updateRoom.mutate({ roomId: room.id, updates: { hidden_conditions: e.target.value } })}
                          placeholder="Potential hidden issues..."
                          className="min-h-[60px] text-sm"
                        />
                      </div>

                      <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={() => deleteRoom.mutate(room.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove Area
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

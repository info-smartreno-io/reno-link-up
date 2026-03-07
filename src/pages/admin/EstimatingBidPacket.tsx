import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstimateWorkspace, useBidPacket } from "@/hooks/useEstimateWorkspace";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, Send, FileText } from "lucide-react";

const TRADES = [
  "Demolition", "Framing", "Electrical", "Plumbing", "HVAC",
  "Insulation", "Drywall", "Flooring", "Tile", "Cabinetry",
  "Painting", "Finish Work", "Exterior Work", "General Conditions",
  "Roofing", "Siding", "Windows", "Doors", "Countertops",
];

export default function EstimatingBidPacket() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["lead-detail", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", leadId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { workspace, isLoading: wsLoading } = useEstimateWorkspace(leadId);
  const { packet, isLoading: packetLoading, createPacket, updatePacket, addTradeSection, deleteTradeSection, addLineItem, deleteLineItem } = useBidPacket(workspace?.id);

  const [newTrade, setNewTrade] = useState("");
  const [newLineItem, setNewLineItem] = useState<{ sectionId: string; description: string; quantity: string; unit: string } | null>(null);

  if (leadLoading || wsLoading) {
    return <AdminLayout><div className="p-4"><Skeleton className="h-64 w-full" /></div></AdminLayout>;
  }

  if (!lead || !workspace) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Please complete Field Mode first.</p>
          <Button onClick={() => navigate(`/admin/estimating/${leadId}/field-mode`)}>Go to Field Mode</Button>
        </div>
      </AdminLayout>
    );
  }

  // Auto-create bid packet if missing
  if (!packetLoading && !packet) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto py-10 space-y-6">
          <Button variant="ghost" onClick={() => navigate("/admin/estimating")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Create Bid Packet</h2>
              <p className="text-muted-foreground">Package scope for <strong>{lead.name}</strong></p>
              <Button onClick={() => createPacket.mutate({ leadId: lead.id, title: `${lead.project_type} - ${lead.name}` })} disabled={createPacket.isPending}>
                {createPacket.isPending ? "Creating..." : "Create Bid Packet"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (packetLoading) {
    return <AdminLayout><div className="p-4"><Skeleton className="h-64 w-full" /></div></AdminLayout>;
  }

  const handleSavePacket = () => {
    // The packet fields are saved via individual field blurs, this just shows confirmation
    toast.success("Bid packet saved");
  };

  const handlePublishToRFP = async () => {
    try {
      // Update packet status
      await updatePacket.mutateAsync({ status: "published", published_at: new Date().toISOString() });

      // Update workspace
      const { error: wsErr } = await supabase
        .from("estimate_workspaces")
        .update({ status: "sent_to_rfp", bid_packet_status: "published", updated_at: new Date().toISOString() })
        .eq("id", workspace.id);
      if (wsErr) throw wsErr;

      // Create RFP / bid opportunity
      const { error: rfpErr } = await supabase.from("bid_opportunities").insert({
        created_by: (await supabase.auth.getUser()).data.user!.id,
        title: packet!.title || `${lead.project_type} - ${lead.name}`,
        description: packet!.scope_summary || lead.client_notes,
        project_type: lead.project_type,
        location: lead.location,
        estimated_budget: packet!.estimated_budget_max,
        bid_deadline: packet!.bid_due_date ? new Date(packet!.bid_due_date).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(),
        status: "open",
        open_to_contractors: true,
        open_to_architects: false,
        open_to_interior_designers: false,
      });
      if (rfpErr) throw rfpErr;

      // Update lead status
      await supabase.from("leads").update({ status: "rfp_out" }).eq("id", lead.id);

      queryClient.invalidateQueries({ queryKey: ["estimate-workspace", leadId] });
      queryClient.invalidateQueries({ queryKey: ["bid-packet", workspace.id] });
      toast.success("Published to RFP — contractors will see this opportunity");
      navigate("/admin/estimating");
    } catch (e: any) {
      toast.error(e.message || "Failed to publish");
    }
  };

  const tradeSections = (packet as any)?.bid_packet_trade_sections || [];

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
              <h1 className="text-xl font-bold text-foreground">Bid Packet: {lead.name}</h1>
              <p className="text-sm text-muted-foreground">{lead.project_type} • {lead.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{packet?.status}</Badge>
            <Button variant="outline" onClick={handleSavePacket} className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button onClick={handlePublishToRFP} className="gap-2" disabled={packet?.status === "published"}>
              <Send className="h-4 w-4" /> Publish to RFP
            </Button>
          </div>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader><CardTitle className="text-base">Project Overview</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Packet Title</label>
              <Input defaultValue={packet?.title || ""} onBlur={e => updatePacket.mutate({ title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Bid Due Date</label>
              <Input type="date" defaultValue={packet?.bid_due_date || ""} onBlur={e => updatePacket.mutate({ bid_due_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Budget Min</label>
              <Input type="number" defaultValue={packet?.estimated_budget_min || ""} onBlur={e => updatePacket.mutate({ estimated_budget_min: parseFloat(e.target.value) || null })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Budget Max</label>
              <Input type="number" defaultValue={packet?.estimated_budget_max || ""} onBlur={e => updatePacket.mutate({ estimated_budget_max: parseFloat(e.target.value) || null })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground">Scope Summary</label>
              <Textarea defaultValue={packet?.scope_summary || ""} onBlur={e => updatePacket.mutate({ scope_summary: e.target.value })} className="min-h-[80px]" placeholder="High-level scope description..." />
            </div>
          </CardContent>
        </Card>

        {/* Inclusions / Exclusions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Inclusions</CardTitle></CardHeader>
            <CardContent>
              <Textarea defaultValue={packet?.inclusions || ""} onBlur={e => updatePacket.mutate({ inclusions: e.target.value })} placeholder="What is included..." className="min-h-[100px]" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Exclusions</CardTitle></CardHeader>
            <CardContent>
              <Textarea defaultValue={packet?.exclusions || ""} onBlur={e => updatePacket.mutate({ exclusions: e.target.value })} placeholder="What is excluded..." className="min-h-[100px]" />
            </CardContent>
          </Card>
        </div>

        {/* Bid Instructions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Bid Instructions</CardTitle></CardHeader>
          <CardContent>
            <Textarea defaultValue={packet?.bid_instructions || ""} onBlur={e => updatePacket.mutate({ bid_instructions: e.target.value })} placeholder="How to submit, what alternates are required, RFI expectations..." className="min-h-[80px]" />
          </CardContent>
        </Card>

        {/* Trade Sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Scope by Trade ({tradeSections.length})</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={newTrade}
                  onChange={(e) => setNewTrade(e.target.value)}
                  className="border border-input rounded-md px-3 py-1.5 text-sm bg-background"
                >
                  <option value="">Select trade...</option>
                  {TRADES.filter(t => !tradeSections.some((s: any) => s.trade === t)).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <Button size="sm" onClick={() => {
                  if (!newTrade) return;
                  addTradeSection.mutate({ trade: newTrade, sortOrder: tradeSections.length });
                  setNewTrade("");
                }} disabled={!newTrade} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Trade
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tradeSections.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No trade sections yet. Add trades above.</p>
            ) : (
              tradeSections.map((section: any) => (
                <div key={section.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{section.trade}</h3>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTradeSection.mutate(section.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Line items */}
                  <div className="space-y-2">
                    {(section.bid_packet_line_items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded p-2">
                        <span className="flex-1">{item.description}</span>
                        <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                        <Button variant="ghost" size="sm" onClick={() => deleteLineItem.mutate(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add line item */}
                  {newLineItem?.sectionId === section.id ? (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input placeholder="Description" value={newLineItem.description} onChange={e => setNewLineItem(p => p ? { ...p, description: e.target.value } : p)} />
                      </div>
                      <Input className="w-20" type="number" placeholder="Qty" value={newLineItem.quantity} onChange={e => setNewLineItem(p => p ? { ...p, quantity: e.target.value } : p)} />
                      <Input className="w-20" placeholder="Unit" value={newLineItem.unit} onChange={e => setNewLineItem(p => p ? { ...p, unit: e.target.value } : p)} />
                      <Button size="sm" onClick={() => {
                        addLineItem.mutate({
                          sectionId: section.id,
                          description: newLineItem.description,
                          quantity: parseFloat(newLineItem.quantity) || 1,
                          unit: newLineItem.unit || "EA",
                        });
                        setNewLineItem(null);
                      }}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setNewLineItem(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setNewLineItem({ sectionId: section.id, description: "", quantity: "1", unit: "EA" })}>
                      <Plus className="h-3.5 w-3.5" /> Add Line Item
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

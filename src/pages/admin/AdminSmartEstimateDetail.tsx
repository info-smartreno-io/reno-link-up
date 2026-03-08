import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useSmartEstimate, useSmartEstimateSections, useSmartEstimateRooms,
  useSmartEstimateTradeItems, useSmartEstimateFiles, useSmartEstimateActivity,
  useSmartEstimateMutations, calculateCompletionPercent, calculateConfidenceScore,
} from "@/hooks/useSmartEstimate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Brain, CheckCircle2, AlertTriangle, Plus, Trash2,
  Sparkles, Save, Send, ThumbsUp, RotateCcw, FileText, Clock, ArrowRight,
} from "lucide-react";
import { SmartEstimateDownstreamDialog } from "@/components/admin/SmartEstimateDownstreamDialog";
import { LinkedDownstreamRecordsCard } from "@/components/admin/LinkedDownstreamRecordsCard";
import { format } from "date-fns";

const SECTION_LABELS: Record<string, string> = {
  project_overview: "Project Overview",
  existing_conditions: "Existing Conditions",
  room_scope: "Room Scope",
  trade_scope: "Trade Scope",
  measurements: "Measurements",
  materials_allowances: "Materials & Allowances",
  site_logistics: "Site Logistics",
  permit_technical: "Permit / Technical",
  budget_guidance: "Budget Guidance",
  missing_info: "Missing Info",
  contractor_estimate_basis: "Contractor Estimate Basis",
};

const TRADE_CATEGORIES = [
  "Demolition", "Framing", "Plumbing", "Electrical", "HVAC", "Insulation",
  "Drywall", "Flooring", "Tile", "Painting", "Finish Carpentry", "Cabinetry",
  "Countertops", "Appliances", "Windows / Doors", "Exterior Finishes",
  "Roofing", "Foundation", "Waterproofing", "Ventilation",
];

export default function AdminSmartEstimateDetail() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const { data: estimate, isLoading } = useSmartEstimate(estimateId);
  const { data: sections = [] } = useSmartEstimateSections(estimateId);
  const { data: rooms = [] } = useSmartEstimateRooms(estimateId);
  const { data: tradeItems = [] } = useSmartEstimateTradeItems(estimateId);
  const { data: files = [] } = useSmartEstimateFiles(estimateId);
  const { data: activity = [] } = useSmartEstimateActivity(estimateId);
  const mutations = useSmartEstimateMutations(estimateId);

  const [activeTab, setActiveTab] = useState("overview");
  const [sectionEdits, setSectionEdits] = useState<Record<string, string>>({});
  const [newRoomName, setNewRoomName] = useState("");
  const [newTradeItem, setNewTradeItem] = useState({ trade_category: "", line_item_name: "", scope_description: "", quantity: 1, unit: "EA" });
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showDownstreamDialog, setShowDownstreamDialog] = useState(false);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);

  // Recalculate completion/confidence when sections change
  useEffect(() => {
    if (!estimateId || sections.length === 0) return;
    const completion = calculateCompletionPercent(sections as any);
    const confidence = calculateConfidenceScore(sections as any, rooms.length, tradeItems.length);
    if (estimate && (estimate.estimate_completion_percent !== completion || estimate.estimate_confidence_score !== confidence)) {
      mutations.updateEstimate.mutate({ estimate_completion_percent: completion, estimate_confidence_score: confidence });
    }
  }, [sections, rooms.length, tradeItems.length]);

  const handleSaveSection = async (sectionKey: string) => {
    const content = sectionEdits[sectionKey];
    if (content === undefined) return;
    await mutations.updateSection.mutateAsync({ sectionKey, sectionData: { content } });
    toast.success("Section saved");
  };

  const handleToggleSectionComplete = (sectionKey: string, current: boolean) => {
    mutations.updateSection.mutate({ sectionKey, isComplete: !current });
  };

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    mutations.addRoom.mutate({ room_name: newRoomName.trim() });
    setNewRoomName("");
  };

  const handleAddTradeItem = () => {
    if (!newTradeItem.trade_category || !newTradeItem.line_item_name) return;
    mutations.addTradeItem.mutate(newTradeItem);
    setNewTradeItem({ trade_category: "", line_item_name: "", scope_description: "", quantity: 1, unit: "EA" });
  };

  const handleAIGenerate = async (sectionKey: string) => {
    if (!estimateId) return;
    setAiGenerating(sectionKey);
    try {
      const { data, error } = await supabase.functions.invoke("smart-estimate-ai", {
        body: { estimateId, sectionKey, action: "generate_section" },
      });
      if (error) throw error;
      if (data?.content) {
        setSectionEdits(prev => ({ ...prev, [sectionKey]: data.content }));
        await mutations.updateSection.mutateAsync({ sectionKey, sectionData: { content: data.content }, aiGenerated: true });
        toast.success("AI draft generated");
      }
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally {
      setAiGenerating(null);
    }
  };

  if (isLoading) return <AdminLayout><p className="p-8 text-muted-foreground">Loading...</p></AdminLayout>;
  if (!estimate) return <AdminLayout><p className="p-8 text-muted-foreground">Estimate not found.</p></AdminLayout>;

  const completion = estimate.estimate_completion_percent || 0;
  const confidence = estimate.estimate_confidence_score || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/smart-estimates")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{estimate.leads?.name || "Smart Estimate"}</h1>
              <p className="text-sm text-muted-foreground">{estimate.leads?.project_type || ""} • {estimate.status?.replace("_", " ")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {estimate.status === "in_progress" && (
              <Button onClick={() => mutations.submitForReview.mutate()} variant="outline">
                <Send className="h-4 w-4 mr-2" /> Submit for Review
              </Button>
            )}
            {estimate.status === "review" && (
              <>
                <Button variant="outline" onClick={() => setShowRevisionDialog(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Request Revision
                </Button>
                <Button onClick={() => mutations.approveEstimate.mutate()}>
                  <ThumbsUp className="h-4 w-4 mr-2" /> Approve
                </Button>
              </>
            )}
            {estimate.status === "approved" && (
              <Button onClick={() => setShowDownstreamDialog(true)}>
                <ArrowRight className="h-4 w-4 mr-2" /> Next: Design / Bid Packet
              </Button>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Completion</p>
              <div className="flex items-center gap-3">
                <Progress value={completion} className="flex-1 h-3" />
                <span className="font-bold text-lg">{completion}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Confidence Score</p>
              <div className="flex items-center gap-2">
                {confidence >= 70 ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                <span className="font-bold text-lg">{confidence}/100</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Rooms / Trade Items</p>
              <p className="font-bold text-lg">{rooms.length} rooms • {tradeItems.length} items</p>
            </CardContent>
          </Card>
        </div>

        {/* Linked Downstream Records */}
        {estimate.status === "approved" && (
          <LinkedDownstreamRecordsCard
            estimateId={estimate.id}
            projectId={estimate.project_id}
            estimateUpdatedAt={estimate.updated_at}
            onSyncRequest={() => setShowDownstreamDialog(true)}
          />
        )}

        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="trade">Trade Scope</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle>Section Checklist</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(SECTION_LABELS).map(([key, label]) => {
                    const sec = sections.find((s: any) => s.section_key === key);
                    return (
                      <div key={key} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={sec?.is_complete || false} onCheckedChange={() => handleToggleSectionComplete(key, sec?.is_complete || false)} />
                          <span className={sec?.is_complete ? "line-through text-muted-foreground" : ""}>{label}</span>
                          {sec?.ai_generated && <Badge variant="outline" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />AI</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sections */}
          <TabsContent value="sections">
            <div className="space-y-4">
              {Object.entries(SECTION_LABELS).map(([key, label]) => {
                const sec = sections.find((s: any) => s.section_key === key);
                const content = sectionEdits[key] ?? (sec?.section_data as any)?.content ?? "";
                return (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{label}</CardTitle>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleAIGenerate(key)} disabled={aiGenerating === key}>
                            <Sparkles className="h-3 w-3 mr-1" /> {aiGenerating === key ? "Generating..." : "AI Generate"}
                          </Button>
                          <Button size="sm" onClick={() => handleSaveSection(key)}>
                            <Save className="h-3 w-3 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={content}
                        onChange={(e) => setSectionEdits(prev => ({ ...prev, [key]: e.target.value }))}
                        rows={4}
                        placeholder={`Enter ${label.toLowerCase()} details...`}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Rooms */}
          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rooms</CardTitle>
                  <div className="flex gap-2">
                    <Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Room name" className="w-48" onKeyDown={(e) => e.key === "Enter" && handleAddRoom()} />
                    <Button onClick={handleAddRoom} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No rooms added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {rooms.map((room: any) => (
                      <div key={room.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{room.room_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {room.room_type && `${room.room_type} • `}
                            {room.floor_level && `${room.floor_level} • `}
                            {room.square_footage && `${room.square_footage} sq ft`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs text-muted-foreground">{tradeItems.filter((t: any) => t.room_id === room.id).length} items</span>
                          <Button variant="ghost" size="icon" onClick={() => mutations.deleteRoom.mutate(room.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Scope */}
          <TabsContent value="trade">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trade Items</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => handleAIGenerate("trade_scope")} disabled={!!aiGenerating}>
                    <Sparkles className="h-3 w-3 mr-1" /> AI Generate Trade Scope
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                  <Select value={newTradeItem.trade_category} onValueChange={(v) => setNewTradeItem(p => ({ ...p, trade_category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Trade" /></SelectTrigger>
                    <SelectContent>{TRADE_CATEGORIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={newTradeItem.line_item_name} onChange={(e) => setNewTradeItem(p => ({ ...p, line_item_name: e.target.value }))} placeholder="Item name" />
                  <Input value={newTradeItem.scope_description} onChange={(e) => setNewTradeItem(p => ({ ...p, scope_description: e.target.value }))} placeholder="Description" />
                  <Input type="number" value={newTradeItem.quantity} onChange={(e) => setNewTradeItem(p => ({ ...p, quantity: Number(e.target.value) }))} placeholder="Qty" />
                  <Button onClick={handleAddTradeItem}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                </div>
                {tradeItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No trade items yet.</p>
                ) : (
                  <div className="space-y-2">
                    {TRADE_CATEGORIES.filter(cat => tradeItems.some((t: any) => t.trade_category === cat)).map(cat => (
                      <div key={cat}>
                        <h4 className="font-semibold text-sm mb-1 mt-3">{cat}</h4>
                        {tradeItems.filter((t: any) => t.trade_category === cat).map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-2 border rounded mb-1">
                            <div>
                              <p className="text-sm font-medium">{item.line_item_name}</p>
                              <p className="text-xs text-muted-foreground">{item.scope_description} • {item.quantity} {item.unit}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => mutations.deleteTradeItem.mutate(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files">
            <Card>
              <CardHeader><CardTitle>Files</CardTitle></CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No files uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {files.map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{f.file_name || f.file_url}</span>
                          <Badge variant="outline" className="text-xs">{f.file_category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            <Card>
              <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No activity recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {activity.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 border rounded">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm">{a.action_type?.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, yyyy h:mm a")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Revision</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Textarea value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} placeholder="Describe what needs revision..." rows={4} />
            <Button onClick={() => { mutations.requestRevision.mutate(revisionNotes); setShowRevisionDialog(false); setRevisionNotes(""); }} disabled={!revisionNotes.trim()}>
              Send Revision Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Downstream Workflow Dialog */}
      <SmartEstimateDownstreamDialog
        open={showDownstreamDialog}
        onOpenChange={setShowDownstreamDialog}
        estimate={estimate}
        sections={sections}
        rooms={rooms}
        tradeItems={tradeItems}
      />
    </AdminLayout>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Star, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PROJECT_TYPE_OPTIONS, BUDGET_RANGE_OPTIONS } from "@/config/designProfessionalOptions";

interface PortfolioItem {
  id: string;
  title: string;
  location: string | null;
  project_type: string | null;
  description: string | null;
  scope_of_work: string | null;
  budget_range: string | null;
  style_tags: string[];
  cover_image_url: string | null;
  featured: boolean;
  sort_order: number;
}

export default function DesignProfessionalPortfolio() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState<Partial<PortfolioItem>>({});

  const { data: items, isLoading } = useQuery({
    queryKey: ["dp-portfolio"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("design_professional_portfolio_items")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as PortfolioItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<PortfolioItem>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (item.id) {
        const { error } = await supabase
          .from("design_professional_portfolio_items")
          .update({ ...item, updated_at: new Date().toISOString() })
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("design_professional_portfolio_items")
          .insert({ ...item, user_id: user.id, sort_order: (items?.length || 0) + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dp-portfolio"] });
      toast.success("Portfolio item saved");
      setShowEditor(false);
      setEditing(null);
      setForm({});
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("design_professional_portfolio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dp-portfolio"] });
      toast.success("Portfolio item deleted");
    },
  });

  const openEditor = (item?: PortfolioItem) => {
    setEditing(item || null);
    setForm(item || { title: "", style_tags: [] });
    setShowEditor(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your best work to attract homeowners</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      {items?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No portfolio items yet</h3>
            <p className="text-muted-foreground mb-4">Add your best projects to showcase your design expertise.</p>
            <Button onClick={() => openEditor()}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items?.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => openEditor(item)}>
              <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.location && <p className="text-sm text-muted-foreground">{item.location}</p>}
                  </div>
                  {item.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                </div>
                {item.project_type && <Badge variant="outline" className="mt-2 text-xs">{item.project_type}</Badge>}
                {item.style_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.style_tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Portfolio Item" : "Add Portfolio Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div>
              <Label>Project Type</Label>
              <Select value={form.project_type || ""} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label>Scope of Work</Label><Textarea value={form.scope_of_work || ""} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} rows={2} /></div>
            <div>
              <Label>Budget Range</Label>
              <Select value={form.budget_range || ""} onValueChange={(v) => setForm({ ...form, budget_range: v })}>
                <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGE_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Style Tags (comma-separated)</Label>
              <Input
                value={(form.style_tags || []).join(", ")}
                onChange={(e) => setForm({ ...form, style_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Modern, Minimalist, Coastal"
              />
            </div>
            <div><Label>Cover Image URL</Label><Input value={form.cover_image_url || ""} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." /></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured || false} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" />
              <span className="text-sm">Featured project</span>
            </label>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && (
              <Button variant="destructive" size="sm" onClick={() => { deleteMutation.mutate(editing.id); setShowEditor(false); }}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            )}
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

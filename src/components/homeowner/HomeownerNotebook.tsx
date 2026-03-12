import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StickyNote, Plus, Trash2, Link2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function useHomeownerNotes() {
  return useQuery({
    queryKey: ["homeowner-notes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("homeowner_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) {
        // If the homeowner_notes table doesn't exist in this environment,
        // fail gracefully instead of breaking the dashboard.
        if (
          (error as any).code === "42P01" ||
          String((error as any).message || "").toLowerCase().includes("homeowner_notes")
        ) {
          console.warn("[HomeownerNotebook] homeowner_notes table missing; skipping notes widget.", error);
          return [];
        }
        throw error;
      }
      return data || [];
    },
  });
}

export function HomeownerNotebook() {
  const queryClient = useQueryClient();
  const { data: notes, isLoading } = useHomeownerNotes();
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const hasLinks = /https?:\/\//.test(content);
      const { error } = await supabase.from("homeowner_notes").insert({
        user_id: user.id,
        content,
        note_type: hasLinks ? "material_link" : "general",
      });
      if (error) {
        if (
          (error as any).code === "42P01" ||
          String((error as any).message || "").toLowerCase().includes("homeowner_notes")
        ) {
          console.warn("[HomeownerNotebook] homeowner_notes table missing; cannot save note.", error);
          throw new Error("Notebook is not available in this environment.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeowner-notes"] });
      setNewNote("");
      setIsAdding(false);
      toast.success("Note saved!");
    },
    onError: () => toast.error("Failed to save note"),
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("homeowner_notes").delete().eq("id", noteId);
      if (error) {
        if (
          (error as any).code === "42P01" ||
          String((error as any).message || "").toLowerCase().includes("homeowner_notes")
        ) {
          console.warn("[HomeownerNotebook] homeowner_notes table missing; cannot delete note.", error);
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeowner-notes"] });
      toast.success("Note deleted");
    },
  });

  const handleSave = () => {
    if (!newNote.trim()) return;
    addNote.mutate(newNote.trim());
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">My Notebook</h4>
          </div>
          {!isAdding && (
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setIsAdding(true)}>
              <Plus className="h-3 w-3" /> Add Note
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Paste links to materials you like, jot down ideas, or save notes for your project team.
        </p>

        {isAdding && (
          <div className="space-y-2 mb-4">
            <Textarea
              placeholder="Paste a link to materials, add notes about your preferences, or anything you want your project team to see…"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewNote(""); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={addNote.isPending || !newNote.trim()}>
                {addNote.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Loading notes…</div>
        ) : notes && notes.length > 0 ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notes.map((note: any) => (
              <div key={note.id} className="group relative p-3 rounded-lg border border-border bg-muted/20 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {note.note_type === "material_link" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5 mb-1.5">
                        <Link2 className="h-2.5 w-2.5" /> Material Link
                      </span>
                    )}
                    <p className="text-foreground whitespace-pre-wrap break-words">{note.content}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => deleteNote.mutate(note.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : !isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-6 border-2 border-dashed border-border rounded-lg text-center hover:bg-muted/30 transition-colors"
          >
            <StickyNote className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">No notes yet. Add links to materials or jot down ideas.</p>
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}

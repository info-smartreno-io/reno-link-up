import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, Sparkles, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { DESIGN_PACKAGE_SECTIONS, calculatePackageCompletion } from "@/config/designProfessionalOptions";

interface Props {
  packageId: string;
  onBack: () => void;
}

export function DesignPackageEditor({ packageId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [activeSectionKey, setActiveSectionKey] = useState<string>(DESIGN_PACKAGE_SECTIONS[0].key);
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const { data: sections, isLoading } = useQuery({
    queryKey: ["design-package-sections", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_package_sections")
        .select("*")
        .eq("design_package_id", packageId);
      if (error) throw error;

      // Initialize content from DB
      const contentMap: Record<string, string> = {};
      (data || []).forEach((s: any) => {
        contentMap[s.section_key] = s.section_data?.content || "";
      });
      setSectionContent((prev) => ({ ...contentMap, ...prev }));
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ sectionKey, content, isComplete }: { sectionKey: string; content: string; isComplete: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const existing = sections?.find((s: any) => s.section_key === sectionKey);

      if (existing) {
        const { error } = await supabase
          .from("design_package_sections")
          .update({
            section_data: { content },
            is_complete: isComplete,
            completion_percent: content.trim() ? (isComplete ? 100 : 50) : 0,
            last_edited_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("design_package_sections")
          .insert({
            design_package_id: packageId,
            section_key: sectionKey,
            section_data: { content },
            is_complete: isComplete,
            completion_percent: content.trim() ? (isComplete ? 100 : 50) : 0,
            last_edited_by: user?.id,
          });
        if (error) throw error;
      }

      // Recalculate package completion
      const { data: allSections } = await supabase
        .from("design_package_sections")
        .select("section_key, is_complete")
        .eq("design_package_id", packageId);

      const completion = calculatePackageCompletion(allSections || []);
      await supabase
        .from("design_packages")
        .update({ package_completion_percent: completion, updated_at: new Date().toISOString() })
        .eq("id", packageId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["design-package-sections", packageId] });
      queryClient.invalidateQueries({ queryKey: ["design-packages"] });
      setDirty((prev) => { const n = new Set(prev); n.delete(vars.sectionKey); return n; });
      toast.success("Section saved");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleGenerate = async (sectionKey: string) => {
    setGenerating(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-design-package`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          section_key: sectionKey,
          context: { package_id: packageId },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI generation failed" }));
        toast.error(err.error || "Generation failed");
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let content = sectionContent[sectionKey] || "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setSectionContent((prev) => ({ ...prev, [sectionKey]: content }));
            }
          } catch { /* partial JSON */ }
        }
      }

      setDirty((prev) => new Set(prev).add(sectionKey));
      toast.success("AI draft generated — review and save when ready");
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const activeSection = DESIGN_PACKAGE_SECTIONS.find((s) => s.key === activeSectionKey);
  const sectionRecord = sections?.find((s: any) => s.section_key === activeSectionKey);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h1 className="text-xl font-bold">Design Package Editor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Section nav */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2">
            {DESIGN_PACKAGE_SECTIONS.map((sec) => {
              const record = sections?.find((s: any) => s.section_key === sec.key);
              const isActive = sec.key === activeSectionKey;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSectionKey(sec.key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  }`}
                >
                  <span>{sec.label}</span>
                  {record?.is_complete && <Check className="h-3 w-3 text-green-600" />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{activeSection?.label}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate(activeSectionKey)}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  AI Generate
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate({
                    sectionKey: activeSectionKey,
                    content: sectionContent[activeSectionKey] || "",
                    isComplete: false,
                  })}
                  disabled={!dirty.has(activeSectionKey) || saveMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" /> Save Draft
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => saveMutation.mutate({
                    sectionKey: activeSectionKey,
                    content: sectionContent[activeSectionKey] || "",
                    isComplete: true,
                  })}
                  disabled={!sectionContent[activeSectionKey]?.trim() || saveMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" /> Mark Complete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sectionContent[activeSectionKey] || ""}
              onChange={(e) => {
                setSectionContent((prev) => ({ ...prev, [activeSectionKey]: e.target.value }));
                setDirty((prev) => new Set(prev).add(activeSectionKey));
              }}
              rows={20}
              placeholder={`Write or generate content for ${activeSection?.label}...`}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

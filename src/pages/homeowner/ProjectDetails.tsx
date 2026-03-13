import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Camera, Link2, AlertCircle } from "lucide-react";

// Dynamic sections per project type (key -> label; materials dropdowns)
const PROJECT_TYPE_SECTIONS: Record<string, { label: string; fields: { key: string; label: string; options?: string[] }[] }> = {
  full_kitchen_remodel: {
    label: "Kitchen details",
    fields: [
      { key: "kitchen_layout", label: "Kitchen layout", options: ["Galley", "L-shape", "U-shape", "Island", "Open to living"] },
      { key: "cabinet_style", label: "Cabinet style", options: ["Shaker", "Flat panel", "Raised panel", "Glass front", "Open shelving"] },
      { key: "countertop_material", label: "Countertop material", options: ["Quartz", "Granite", "Marble", "Butcher block", "Laminate", "Other"] },
      { key: "appliances", label: "Appliances", options: ["Keep existing", "Standard upgrade", "Premium / pro"] },
      { key: "backsplash", label: "Backsplash", options: ["Tile", "Stone", "Glass", "Stainless", "None yet"] },
      { key: "flooring", label: "Flooring", options: ["Hardwood", "Tile", "LVP", "Laminate", "Other"] },
    ],
  },
  kitchen_refresh: {
    label: "Kitchen refresh",
    fields: [
      { key: "cabinet_style", label: "Cabinet style", options: ["Reface", "Repaint", "New doors only"] },
      { key: "countertop_material", label: "Countertop", options: ["Quartz", "Granite", "Laminate", "Other"] },
      { key: "flooring", label: "Flooring", options: ["Keep", "Hardwood", "Tile", "LVP", "Other"] },
    ],
  },
  full_bathroom_remodel: {
    label: "Bathroom details",
    fields: [
      { key: "shower", label: "Shower", options: ["Walk-in", "Tub-shower combo", "Convert tub to shower", "New enclosure"] },
      { key: "tub", label: "Tub", options: ["Keep", "Soaking tub", "Freestanding", "Remove"] },
      { key: "vanity", label: "Vanity", options: ["Single", "Double", "Floating", "Custom"] },
      { key: "tile", label: "Tile", options: ["Floor only", "Floor and walls", "Full surround", "Accent"] },
      { key: "fixtures", label: "Fixtures", options: ["Standard", "Upgraded", "Luxury"] },
    ],
  },
  bathroom_refresh: {
    label: "Bathroom refresh",
    fields: [
      { key: "vanity", label: "Vanity", options: ["Replace", "Refinish", "Keep"] },
      { key: "fixtures", label: "Fixtures", options: ["Faucet", "Showerhead", "Both", "Full set"] },
    ],
  },
  basement_finishing: {
    label: "Basement details",
    fields: [
      { key: "use", label: "Primary use", options: ["Living / family room", "Bedroom suite", "Home office", "Gym", "Theater", "Multi-use"] },
      { key: "bathroom", label: "Bathroom", options: ["Yes", "No", "Half bath"] },
      { key: "flooring", label: "Flooring", options: ["Carpet", "LVP", "Tile", "Other"] },
    ],
  },
  home_addition: {
    label: "Addition details",
    fields: [
      { key: "type", label: "Type", options: ["Room addition", "Sunroom", "Second story", "In-law suite"] },
      { key: "flooring", label: "Flooring", options: ["Match existing", "Hardwood", "Tile", "Other"] },
    ],
  },
  whole_home_renovation: {
    label: "Whole home",
    fields: [
      { key: "priority_areas", label: "Priority areas", options: ["Kitchen first", "Bathrooms first", "All at once", "Phased"] },
      { key: "flooring", label: "Flooring", options: ["Hardwood", "Tile", "LVP", "Mix", "Other"] },
    ],
  },
};

const DEFAULT_SECTIONS = {
  label: "Project details",
  fields: [
    { key: "flooring", label: "Flooring", options: ["Hardwood", "Tile", "LVP", "Laminate", "Other"] },
    { key: "materials", label: "Materials preference", options: ["Budget", "Mid-range", "Premium", "Mixed"] },
  ],
};

export default function ProjectDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [lengthFt, setLengthFt] = useState("");
  const [widthFt, setWidthFt] = useState("");
  const [ceilingHeightFt, setCeilingHeightFt] = useState("");
  const [materials, setMaterials] = useState<Record<string, string>>({});
  const [inspirationLinks, setInspirationLinks] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const { data: project, isLoading: loadingProject, isError: projectError, error: projectErr, refetch: refetchProject } = useQuery({
    queryKey: ["homeowner-intake-project-details"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_type, visit_confirmed")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const { data: existingDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["project-details", project?.id],
    enabled: !!project?.id,
    queryFn: async () => {
      if (!project?.id) return null;
      const { data, error } = await supabase
        .from("project_details")
        .select("description, measurements, materials, inspiration_links")
        .eq("project_id", project.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
    retry: 1,
  });

  // Route guards: redirect when no project or visit not confirmed
  useEffect(() => {
    if (loadingProject || projectError) return;
    if (!project) {
      navigate("/homeowner/dashboard", { replace: true });
      return;
    }
    if ((project as { visit_confirmed?: boolean }).visit_confirmed !== true) {
      navigate("/homeowner/schedule-visit", { replace: true });
    }
  }, [loadingProject, projectError, project, navigate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error("No project");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const existingUrls: string[] = Array.isArray(
        (existingDetails?.measurements as Record<string, unknown>)?.photo_urls
      )
        ? ((existingDetails?.measurements as Record<string, unknown>).photo_urls as string[])
        : [];

      let photoUrls: string[] = [...existingUrls];
      if (photoFiles.length > 0) {
        let uploadFailCount = 0;
        for (const file of photoFiles) {
          const path = `project-details/${user.id}/${project.id}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from("project-files").upload(path, file);
          if (upErr) {
            uploadFailCount += 1;
            console.error("Project details upload error:", upErr);
          } else {
            const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
            photoUrls.push(urlData.publicUrl);
          }
        }
        if (uploadFailCount > 0) {
          toast.error(`${uploadFailCount} file(s) could not be uploaded. Other details will still be saved.`);
        } else if (photoFiles.length > 0) {
          toast.success("Files uploaded.");
        }
      }

      const measurements = {
        length_ft: lengthFt ? parseFloat(lengthFt) : null,
        width_ft: widthFt ? parseFloat(widthFt) : null,
        ceiling_height_ft: ceilingHeightFt ? parseFloat(ceilingHeightFt) : null,
        photo_urls: photoUrls,
      };
      const links = inspirationLinks
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("project_details")
        .upsert(
          {
            project_id: project.id,
            description: description || null,
            measurements,
            materials: Object.keys(materials).length ? materials : {},
            inspiration_links: links,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "project_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homeowner-project-details-check"] });
      queryClient.invalidateQueries({ queryKey: ["project-details", project?.id] });
      toast.success("Details saved. Our team will use this to prepare for your visit.");
      navigate("/homeowner/dashboard", { replace: true });
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? "Failed to save.");
    },
  });

  useEffect(() => {
    if (!existingDetails) return;
    setDescription(existingDetails.description ?? "");
    const m = (existingDetails.measurements as Record<string, unknown>) ?? {};
    setLengthFt(m.length_ft != null ? String(m.length_ft) : "");
    setWidthFt(m.width_ft != null ? String(m.width_ft) : "");
    setCeilingHeightFt(m.ceiling_height_ft != null ? String(m.ceiling_height_ft) : "");
    setMaterials((existingDetails.materials as Record<string, string>) ?? {});
    const links = (existingDetails.inspiration_links as string[]) ?? [];
    setInspirationLinks(links.join("\n"));
  }, [existingDetails]);

  const sections = project?.project_type && PROJECT_TYPE_SECTIONS[project.project_type]
    ? PROJECT_TYPE_SECTIONS[project.project_type]
    : DEFAULT_SECTIONS;

  if (loadingProject) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground">Project details</h1>
        <Card className="border-destructive/50">
          <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground">
              We couldn’t load your project. Please try again or return to the dashboard.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/homeowner/dashboard")}>
                Back to Dashboard
              </Button>
              <Button onClick={() => refetchProject()}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  if ((project as { visit_confirmed?: boolean }).visit_confirmed !== true) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Project details</h1>
        <p className="text-muted-foreground mt-1">
          {loadingDetails
            ? "Loading your saved details…"
            : "We just need a little more information before we confirm your appointment."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description / notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Room dimensions, materials preferred, style preferences…"
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Measurements (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Length (ft)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={lengthFt}
              onChange={(e) => setLengthFt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Width (ft)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={widthFt}
              onChange={(e) => setWidthFt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ceiling height (ft)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={ceilingHeightFt}
              onChange={(e) => setCeilingHeightFt(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{sections.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.fields.map(({ key, label, options }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              {options ? (
                <Select
                  value={materials[key] ?? ""}
                  onValueChange={(v) => setMaterials((prev) => ({ ...prev, [key]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={materials[key] ?? ""}
                  onChange={(e) => setMaterials((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={label}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Inspiration links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inspirationLinks}
            onChange={(e) => setInspirationLinks(e.target.value)}
            placeholder="Paste links to Pinterest, product pages, or photos (one per line or comma-separated)"
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photos / files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
            onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
          />
          {photoFiles.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{photoFiles.length} file(s) selected</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/homeowner/dashboard")}>
          Cancel
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </div>
  );
}

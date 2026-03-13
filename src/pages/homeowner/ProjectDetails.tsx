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
import { Camera, Link2, AlertCircle, CreditCard } from "lucide-react";
import watermarkArchitect from "@/assets/watermark-architect.png";

// Simple global materials preference
const DEFAULT_SECTIONS = {
  label: "Materials preference",
  fields: [
    {
      key: "materials_preference",
      label: "Materials preference",
      options: ["Budget", "Mid-range", "Premium", "Mixed"],
    },
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
  const [surveyFile, setSurveyFile] = useState<File | null>(null);
  const [financingIntent, setFinancingIntent] = useState("");
  const [financingType, setFinancingType] = useState("");
  const [financingNotes, setFinancingNotes] = useState("");
  const [room, setRoom] = useState("");
  const [interiorStyle, setInteriorStyle] = useState("");
  const [houseStyle, setHouseStyle] = useState("");
  const [hoveredInteriorStyle, setHoveredInteriorStyle] = useState("");
  const [hoveredHouseStyle, setHoveredHouseStyle] = useState("");
  const [contractorFactors, setContractorFactors] = useState<string[]>([]);
  const [additionalRooms, setAdditionalRooms] = useState<
    { id: string; room: string; lengthFt: string; widthFt: string; ceilingHeightFt: string }[]
  >([]);

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
      const existingSurveyUrl: string | null =
        ((existingDetails?.measurements as Record<string, unknown>)?.survey_url as string | null) ??
        null;

      let photoUrls: string[] = [...existingUrls];
      let surveyUrl: string | null = existingSurveyUrl;

      if (photoFiles.length === 0 && existingUrls.length === 0) {
        throw new Error("Please upload at least one photo of the space so our team can prepare.");
      }

      if (isAddition && !surveyFile && !existingSurveyUrl) {
        throw new Error("For additions, please upload a current property survey before continuing.");
      }
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

      if (surveyFile) {
        const surveyPath = `project-details/${user.id}/${project.id}/survey-${Date.now()}-${surveyFile.name}`;
        const { error: surveyErr } = await supabase.storage
          .from("project-files")
          .upload(surveyPath, surveyFile);
        if (surveyErr) {
          console.error("Survey upload error:", surveyErr);
          throw new Error("We couldn't upload your survey. Please try again.");
        }
        const { data: surveyUrlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(surveyPath);
        surveyUrl = surveyUrlData.publicUrl;
      }

      const materialsPref = materials.materials_preference;
      const roomLabel = room ? ROOM_LABELS[room] ?? room : "";
      const interiorInfo =
        (interiorStyle && INTERIOR_STYLE_INFO[interiorStyle]) || null;
      const houseInfo = (houseStyle && HOUSE_STYLE_INFO[houseStyle]) || null;

      if (!financingIntent) {
        throw new Error("Please tell us how you expect to pay for this project.");
      }
      if (
        (financingIntent === "yes_full" ||
          financingIntent === "yes_partial" ||
          financingIntent === "unsure") &&
        !financingType
      ) {
        throw new Error("Please select which type of financing you are most likely to use.");
      }

      const pieces: string[] = [];
      if (roomLabel) {
        pieces.push(`Space: ${roomLabel}`);
      }
      if (lengthFt || widthFt || ceilingHeightFt) {
        const dims = [
          lengthFt && `L ${lengthFt} ft`,
          widthFt && `W ${widthFt} ft`,
          ceilingHeightFt && `H ${ceilingHeightFt} ft`,
        ]
          .filter(Boolean)
          .join(", ");
        if (dims) {
          pieces.push(`Approx. dimensions: ${dims}`);
        }
      }
      if (interiorInfo) {
        pieces.push(`Interior style: ${interiorInfo.label}`);
      }
      if (houseInfo) {
        pieces.push(`House style: ${houseInfo.label}`);
      }
      if (materialsPref) {
        pieces.push(`Materials preference: ${materialsPref}`);
      }
      if (contractorFactors.length) {
        pieces.push(
          `Most important in contractor: ${contractorFactors
            .map((f) => f.replace(/_/g, " "))
            .join(", ")}`
        );
      }

      const autoSummary =
        pieces.length > 0 ? `Auto summary: ${pieces.join(" · ")}` : null;

      const additionalRoomsPayload = additionalRooms.map((r) => ({
        id: r.id,
        room: r.room || null,
        length_ft: r.lengthFt ? parseFloat(r.lengthFt) : null,
        width_ft: r.widthFt ? parseFloat(r.widthFt) : null,
        ceiling_height_ft: r.ceilingHeightFt ? parseFloat(r.ceilingHeightFt) : null,
      }));

      const measurements = {
        length_ft: lengthFt ? parseFloat(lengthFt) : null,
        width_ft: widthFt ? parseFloat(widthFt) : null,
        ceiling_height_ft: ceilingHeightFt ? parseFloat(ceilingHeightFt) : null,
        photo_urls: photoUrls,
        survey_url: surveyUrl,
        financing: {
          intent: financingIntent || null,
          type: financingType || null,
          notes: financingNotes || null,
        },
        room: room || null,
        interior_style: interiorStyle || null,
        house_style: houseStyle || null,
        contractor_factors: contractorFactors,
        additional_rooms: additionalRoomsPayload,
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
            description: [description, autoSummary].filter(Boolean).join("\n\n") || null,
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
    setRoom((m.room as string) ?? "");
    setInteriorStyle((m.interior_style as string) ?? "");
    setHouseStyle((m.house_style as string) ?? "");
    setMaterials((existingDetails.materials as Record<string, string>) ?? {});
    const links = (existingDetails.inspiration_links as string[]) ?? [];
    setInspirationLinks(links.join("\n"));
    const financing = (m.financing as Record<string, unknown>) ?? {};
    setFinancingIntent((financing.intent as string) ?? "");
    setFinancingType((financing.type as string) ?? "");
    setFinancingNotes((financing.notes as string) ?? "");
    const factors = (m.contractor_factors as string[]) ?? [];
    setContractorFactors(factors);
    const extraRooms = (m.additional_rooms as any[]) ?? [];
    setAdditionalRooms(
      extraRooms.map((r, idx) => ({
        id: (r.id as string) || `extra-${idx}`,
        room: (r.room as string) ?? "",
        lengthFt: r.length_ft != null ? String(r.length_ft) : "",
        widthFt: r.width_ft != null ? String(r.width_ft) : "",
        ceilingHeightFt: r.ceiling_height_ft != null ? String(r.ceiling_height_ft) : "",
      }))
    );
  }, [existingDetails]);

  const sections = DEFAULT_SECTIONS;
  const isAddition = project?.project_type === "home_addition";

  const ROOM_LABELS: Record<string, string> = {
    kitchen: "kitchen",
    primary_bath: "primary bathroom",
    hall_bath: "hall bathroom",
    powder_room: "powder room",
    bedroom: "bedroom",
    basement: "basement",
    family_room: "family room",
    addition: "addition",
    whole_home: "whole home",
    other: "other space",
  };

  const INTERIOR_STYLE_INFO: Record<
    string,
    { label: string; description: string; image: string }
  > = {
    modern: {
      label: "Modern",
      description: "Clean lines, simple cabinetry, and minimal trim with a focus on function.",
      image: watermarkArchitect,
    },
    transitional: {
      label: "Transitional",
      description: "Blend of classic and modern — warm, timeless, and not too formal.",
      image: watermarkArchitect,
    },
    traditional: {
      label: "Traditional",
      description: "More detail in trim, doors, and cabinets; comfortable and familiar.",
      image: watermarkArchitect,
    },
    scandinavian: {
      label: "Scandinavian",
      description: "Light, bright, natural materials with a calm, airy feel.",
      image: watermarkArchitect,
    },
    farmhouse: {
      label: "Modern farmhouse",
      description: "Warm whites, wood tones, and simple details — clean but cozy.",
      image: watermarkArchitect,
    },
    minimal: {
      label: "Minimal / contemporary",
      description: "Very streamlined with limited materials and clutter-free surfaces.",
      image: watermarkArchitect,
    },
    not_sure: {
      label: "Not sure yet",
      description: "We’ll help you narrow in on a direction based on your photos and links.",
      image: watermarkArchitect,
    },
  };

  const HOUSE_STYLE_INFO: Record<
    string,
    { label: string; description: string; image: string }
  > = {
    colonial: {
      label: "Colonial",
      description: "Two-story, symmetrical front with a center entry and traditional details.",
      image: watermarkArchitect,
    },
    cape_cod: {
      label: "Cape Cod",
      description: "1–1.5 stories with dormers and a simple, compact footprint.",
      image: watermarkArchitect,
    },
    ranch: {
      label: "Ranch",
      description: "Single-story, long and low, often with an open main living area.",
      image: watermarkArchitect,
    },
    split_level: {
      label: "Split-level",
      description: "Offset levels with short stair runs between living zones.",
      image: watermarkArchitect,
    },
    townhouse: {
      label: "Townhouse",
      description: "Multi-level attached home with shared walls and narrower footprint.",
      image: watermarkArchitect,
    },
    condo: {
      label: "Condo / apartment",
      description: "Unit within a larger building with shared entries and systems.",
      image: watermarkArchitect,
    },
    other: {
      label: "Other / not sure",
      description: "We’ll infer style from your photos and exterior shots where available.",
      image: watermarkArchitect,
    },
  };

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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Project details</h1>
        <p className="text-muted-foreground mt-1">
          {loadingDetails
            ? "Loading your saved details…"
            : "We just need a few more details, photos, and (for additions) a survey so your SmartReno team can prepare for the visit."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Space & style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Room / area</Label>
              {room && (
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setRoom("");
                    setLengthFt("");
                    setWidthFt("");
                    setCeilingHeightFt("");
                  }}
                >
                  Clear room
                </button>
              )}
            </div>
            <Select value={room} onValueChange={setRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room or area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="primary_bath">Primary bathroom</SelectItem>
                <SelectItem value="hall_bath">Hall bathroom</SelectItem>
                <SelectItem value="powder_room">Powder room</SelectItem>
                <SelectItem value="bedroom">Bedroom</SelectItem>
                <SelectItem value="basement">Basement</SelectItem>
                <SelectItem value="family_room">Family room</SelectItem>
                <SelectItem value="addition">Addition</SelectItem>
                <SelectItem value="whole_home">Whole home</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>

          <div className="space-y-2 pt-2 border-t border-dashed border-border">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-muted-foreground">
                Additional rooms or areas (optional)
              </Label>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  setAdditionalRooms((prev) => [
                    ...prev,
                    {
                      id: `extra-${Date.now()}-${prev.length}`,
                      room: "",
                      lengthFt: "",
                      widthFt: "",
                      ceilingHeightFt: "",
                    },
                  ])
                }
              >
                Add another room
              </Button>
            </div>
            {additionalRooms.length > 0 && (
              <div className="space-y-3">
                {additionalRooms.map((r, idx) => (
                  <div
                    key={r.id}
                    className="rounded-md border border-border bg-muted/30 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Room {idx + 2}
                      </Label>
                      <button
                        type="button"
                        className="text-[11px] text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setAdditionalRooms((prev) => prev.filter((x) => x.id !== r.id))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Room</Label>
                        <Select
                          value={r.room}
                          onValueChange={(val) =>
                            setAdditionalRooms((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, room: val } : x
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kitchen">Kitchen</SelectItem>
                            <SelectItem value="primary_bath">Primary bath</SelectItem>
                            <SelectItem value="hall_bath">Hall bath</SelectItem>
                            <SelectItem value="powder_room">Powder room</SelectItem>
                            <SelectItem value="bedroom">Bedroom</SelectItem>
                            <SelectItem value="living_room">Living room</SelectItem>
                            <SelectItem value="basement">Basement</SelectItem>
                            <SelectItem value="family_room">Family room</SelectItem>
                            <SelectItem value="addition">Addition</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">L (ft)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={r.lengthFt}
                          onChange={(e) =>
                            setAdditionalRooms((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, lengthFt: e.target.value } : x
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">W (ft)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={r.widthFt}
                          onChange={(e) =>
                            setAdditionalRooms((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, widthFt: e.target.value } : x
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">H (ft)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={r.ceilingHeightFt}
                          onChange={(e) =>
                            setAdditionalRooms((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, ceilingHeightFt: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interior design style</Label>
              <Select value={interiorStyle} onValueChange={setInteriorStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interior style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="modern"
                    onMouseEnter={() => setHoveredInteriorStyle("modern")}
                    onMouseLeave={() => setHoveredInteriorStyle("")}
                  >
                    Modern
                  </SelectItem>
                  <SelectItem
                    value="transitional"
                    onMouseEnter={() => setHoveredInteriorStyle("transitional")}
                    onMouseLeave={() => setHoveredInteriorStyle("")}
                  >
                    Transitional
                  </SelectItem>
                  <SelectItem
                    value="traditional"
                    onMouseEnter={() => setHoveredInteriorStyle("traditional")}
                    onMouseLeave={() => setHoveredInteriorStyle("")}
                  >
                    Traditional
                  </SelectItem>
                  <SelectItem
                    value="scandinavian"
                    onMouseEnter={() => setHoveredInteriorStyle("scandinavian")}
                    onMouseLeave={() => setHoveredInteriorStyle("")}
                  >
                    Scandinavian
                  </SelectItem>
                  <SelectItem
                    value="farmhouse"
                    onMouseEnter={() => setHoveredInteriorStyle("farmhouse")}
                    onMouseLeave={() => setHoveredInteriorStyle("")}
                  >
                    Modern farmhouse
                  </SelectItem>
                  <SelectItem
                    value="minimal"
                    onMouseEnter={() => setHoveredInteriorStyle("minimal")}
                    onMouseLeave={() => setHoveredInteriorStyle("")}
                  >
                    Minimal / contemporary
                  </SelectItem>
                  <SelectItem
                    value="not_sure"
                    onMouseEnter={() => setHoveredInteriorStyle("not_sure")}
                    onMouseLeave={() => setHoveredInteriorStyle("")}
                  >
                    I&apos;m not sure yet
                  </SelectItem>
                </SelectContent>
              </Select>
              {(() => {
                const key = hoveredInteriorStyle || interiorStyle;
                const info = key ? INTERIOR_STYLE_INFO[key] : null;
                if (!info) return null;
                return (
                  <div className="mt-2 flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 p-3">
                    <img
                      src={info.image}
                      alt={info.label}
                      className="h-20 w-20 rounded-md object-cover border border-border bg-background"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">{info.label}</p>
                      <p className="text-[11px] text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-2">
              <Label>House style</Label>
              <Select value={houseStyle} onValueChange={setHouseStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select house style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="colonial"
                    onMouseEnter={() => setHoveredHouseStyle("colonial")}
                    onMouseLeave={() => setHoveredHouseStyle("")}
                  >
                    Colonial
                  </SelectItem>
                  <SelectItem
                    value="cape_cod"
                    onMouseEnter={() => setHoveredHouseStyle("cape_cod")}
                    onMouseLeave={() => setHoveredHouseStyle("")}
                  >
                    Cape Cod
                  </SelectItem>
                  <SelectItem
                    value="ranch"
                    onMouseEnter={() => setHoveredHouseStyle("ranch")}
                    onMouseLeave={() => setHoveredHouseStyle("")}
                  >
                    Ranch
                  </SelectItem>
                  <SelectItem
                    value="split_level"
                    onMouseEnter={() => setHoveredHouseStyle("split_level")}
                    onMouseLeave={() => setHoveredHouseStyle("")}
                  >
                    Split-level
                  </SelectItem>
                  <SelectItem
                    value="townhouse"
                    onMouseEnter={() => setHoveredHouseStyle("townhouse")}
                    onMouseLeave={() => setHoveredHouseStyle("")}
                  >
                    Townhouse
                  </SelectItem>
                  <SelectItem
                    value="condo"
                    onMouseEnter={() => setHoveredHouseStyle("condo")}
                    onMouseLeave={() => setHoveredHouseStyle("")}
                  >
                    Condo / apartment
                  </SelectItem>
                  <SelectItem
                    value="other"
                    onMouseEnter={() => setHoveredHouseStyle("other")}
                    onMouseLeave={() => setHoveredHouseStyle("")}
                  >
                    Other / not sure
                  </SelectItem>
                </SelectContent>
              </Select>
              {(() => {
                const key = hoveredHouseStyle || houseStyle;
                const info = key ? HOUSE_STYLE_INFO[key] : null;
                if (!info) return null;
                return (
                  <div className="mt-2 flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 p-3">
                    <img
                      src={info.image}
                      alt={info.label}
                      className="h-20 w-20 rounded-md object-cover border border-border bg-background"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">{info.label}</p>
                      <p className="text-[11px] text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Anything else about this space? (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For example: must-keep items, pain points, or special requests."
              className="min-h-[100px]"
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
              <Select
                value={materials[key] ?? ""}
                onValueChange={(v) => setMaterials((prev) => ({ ...prev, [key]: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            Photos & documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Photos of the space{" "}
              <span className="text-destructive text-xs align-middle">(required)</span>
            </Label>
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
              onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
            />
            {photoFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {photoFiles.length} photo{photoFiles.length === 1 ? "" : "s"} selected
              </p>
            )}
          </div>

          {isAddition && (
            <div className="space-y-2">
              <Label>
                Property survey{" "}
                <span className="text-destructive text-xs align-middle">(required for additions)</span>
              </Label>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
                onChange={(e) => setSurveyFile((e.target.files && e.target.files[0]) || null)}
              />
              {surveyFile && (
                <p className="text-xs text-muted-foreground">
                  1 file selected ({surveyFile.name})
                </p>
              )}
              {!surveyFile &&
                ((existingDetails?.measurements as any)?.survey_url as string | null) && (
                  <p className="text-xs text-muted-foreground">
                    Using the survey previously uploaded for this project.
                  </p>
                )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Clear photos (and a survey for additions) help your estimator confirm scope, spot red flags,
            and keep your first proposal as accurate as possible.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Financing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              How do you expect to pay for this project?
            </Label>
            <Select value={financingIntent} onValueChange={setFinancingIntent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes_full">I plan to fully finance the project</SelectItem>
                <SelectItem value="yes_partial">I&apos;ll finance part and pay some cash</SelectItem>
                <SelectItem value="no">I plan to pay entirely in cash</SelectItem>
                <SelectItem value="unsure">I&apos;m not sure yet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(financingIntent === "yes_full" ||
            financingIntent === "yes_partial" ||
            financingIntent === "unsure") && (
            <div className="space-y-2">
              <Label>
                Which type of financing are you most likely to use?
              </Label>
              <Select value={financingType} onValueChange={setFinancingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select financing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heloc">Home equity line or loan</SelectItem>
                  <SelectItem value="reno_loan">Renovation / construction loan</SelectItem>
                  <SelectItem value="personal_loan">Personal loan or line of credit</SelectItem>
                  <SelectItem value="contractor_financing">Contractor-offered financing</SelectItem>
                  <SelectItem value="other">Other / not sure yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Anything else we should know about budget or financing?</Label>
            <Textarea
              value={financingNotes}
              onChange={(e) => setFinancingNotes(e.target.value)}
              placeholder="For example: target monthly payment, rough budget range, or any timing constraints."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            What matters most when choosing a contractor?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Pick the top 2–3 things that will matter most to you when comparing bids and selecting a contractor.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { key: "pricing_transparency", label: "Transparent, detailed pricing" },
              { key: "timeline_reliability", label: "Reliable timeline / schedule" },
              { key: "craftsmanship", label: "Craftsmanship & quality of work" },
              { key: "communication", label: "Communication & responsiveness" },
              { key: "cleanup_respect", label: "Cleanliness & respect for my home" },
              { key: "reviews_reputation", label: "Reviews & reputation" },
              { key: "design_support", label: "Design guidance & selections support" },
              { key: "warranty_support", label: "Warranty & post-project support" },
            ].map(({ key, label }) => {
              const active = contractorFactors.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`text-xs text-left rounded-md border px-3 py-2 transition-colors ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background hover:border-primary/60 hover:bg-primary/5"
                  }`}
                  onClick={() =>
                    setContractorFactors((prev) =>
                      prev.includes(key)
                        ? prev.filter((f) => f !== key)
                        : [...prev, key]
                    )
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useHomeProfile() {
  return useQuery({
    queryKey: ["home-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("home_profiles")
        .select("*")
        .eq("homeowner_user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHomeProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("home_profiles" as any)
        .insert({ ...profile, homeowner_user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-profile"] });
      toast.success("Home profile created!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateHomeProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Record<string, any>) => {
      const { data, error } = await supabase
        .from("home_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-profile"] });
      toast.success("Home profile updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHomeSystems(profileId: string | undefined) {
  return useQuery({
    queryKey: ["home-systems", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_systems")
        .select("*")
        .eq("home_profile_id", profileId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHomeSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (system: Record<string, any>) => {
      const { data, error } = await supabase
        .from("home_systems")
        .insert(system)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["home-systems", data.home_profile_id] });
      toast.success("System added!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateHomeSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Record<string, any>) => {
      const { data, error } = await supabase
        .from("home_systems")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["home-systems", data.home_profile_id] });
      toast.success("System updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHomePhotos(profileId: string | undefined) {
  return useQuery({
    queryKey: ["home-photos", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_photos")
        .select("*")
        .eq("home_profile_id", profileId!)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useHomeDocuments(profileId: string | undefined) {
  return useQuery({
    queryKey: ["home-documents", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_documents")
        .select("*")
        .eq("home_profile_id", profileId!)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useHomeInsights(profileId: string | undefined) {
  return useQuery({
    queryKey: ["home-insights", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_ai_insights")
        .select("*")
        .eq("home_profile_id", profileId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMaintenanceEvents(profileId: string | undefined) {
  return useQuery({
    queryKey: ["maintenance-events", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_maintenance_events")
        .select("*")
        .eq("home_profile_id", profileId!)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMaintenanceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("home_maintenance_events")
        .insert({ ...event, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["maintenance-events", data.home_profile_id] });
      toast.success("Maintenance event added!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadHomePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, profileId, category, caption }: { file: File; profileId: string; category: string; caption?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${profileId}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("home-photos")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("home-photos").getPublicUrl(filePath);
      const { data, error } = await supabase
        .from("home_photos")
        .insert({
          home_profile_id: profileId,
          category,
          file_name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          caption,
          uploaded_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["home-photos", data.home_profile_id] });
      toast.success("Photo uploaded!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadHomeDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, profileId, documentType }: { file: File; profileId: string; documentType: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${profileId}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("home-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("home-documents").getPublicUrl(filePath);
      const { data, error } = await supabase
        .from("home_documents")
        .insert({
          home_profile_id: profileId,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          mime_type: file.type,
          file_size_bytes: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["home-documents", data.home_profile_id] });
      toast.success("Document uploaded!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateHomeInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-home-insights", {
        body: { home_profile_id: profileId, run_scope: "full" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, profileId) => {
      qc.invalidateQueries({ queryKey: ["home-insights", profileId] });
      qc.invalidateQueries({ queryKey: ["home-systems", profileId] });
      qc.invalidateQueries({ queryKey: ["home-profile"] });
      toast.success("AI insights generated!");
    },
    onError: (e: Error) => toast.error("Failed to generate insights: " + e.message),
  });
}

export const SYSTEM_TYPES = [
  { value: "roof", label: "Roof" },
  { value: "gutters", label: "Gutters" },
  { value: "siding", label: "Siding" },
  { value: "windows", label: "Windows" },
  { value: "exterior_doors", label: "Exterior Doors" },
  { value: "driveway_masonry", label: "Driveway / Masonry" },
  { value: "foundation", label: "Foundation" },
  { value: "deck_patio", label: "Deck / Patio" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical_panel", label: "Electrical Panel" },
  { value: "wiring", label: "Wiring" },
  { value: "hvac", label: "HVAC" },
  { value: "furnace_boiler", label: "Furnace / Boiler" },
  { value: "central_ac", label: "Central AC" },
  { value: "water_heater", label: "Water Heater" },
  { value: "septic", label: "Septic" },
  { value: "well", label: "Well" },
  { value: "insulation", label: "Insulation" },
  { value: "attic_ventilation", label: "Attic Ventilation" },
  { value: "appliances", label: "Appliances" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathrooms", label: "Bathrooms" },
  { value: "flooring", label: "Flooring" },
  { value: "interior_paint", label: "Interior Paint" },
  { value: "exterior_paint", label: "Exterior Paint" },
  { value: "other", label: "Other" },
];

export const PHOTO_CATEGORIES = [
  { value: "front_exterior", label: "Front Exterior" },
  { value: "rear_exterior", label: "Rear Exterior" },
  { value: "roof", label: "Roof" },
  { value: "siding", label: "Siding" },
  { value: "driveway", label: "Driveway" },
  { value: "landscaping", label: "Landscaping" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "basement", label: "Basement" },
  { value: "attic", label: "Attic" },
  { value: "electrical_panel", label: "Electrical Panel" },
  { value: "furnace", label: "Furnace" },
  { value: "water_heater", label: "Water Heater" },
  { value: "hvac_condenser", label: "HVAC Condenser" },
  { value: "windows", label: "Windows" },
  { value: "doors", label: "Doors" },
  { value: "foundation", label: "Foundation" },
  { value: "crawlspace", label: "Crawlspace" },
  { value: "other", label: "Other" },
];

export const DOCUMENT_TYPES = [
  { value: "home_inspection_report", label: "Home Inspection Report" },
  { value: "roof_report", label: "Roof Report" },
  { value: "hvac_service_record", label: "HVAC Service Record" },
  { value: "plumbing_report", label: "Plumbing Report" },
  { value: "electrical_report", label: "Electrical Report" },
  { value: "appliance_manual", label: "Appliance Manual" },
  { value: "warranty", label: "Warranty" },
  { value: "permit", label: "Permit" },
  { value: "survey", label: "Survey" },
  { value: "architectural_plan", label: "Architectural Plan" },
  { value: "invoice", label: "Invoice" },
  { value: "maintenance_record", label: "Maintenance Record" },
  { value: "receipt", label: "Receipt" },
  { value: "other", label: "Other" },
];

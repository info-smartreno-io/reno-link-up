import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SECTION_KEYS = [
  "project_overview", "existing_conditions", "room_scope", "trade_scope",
  "measurements", "materials_allowances", "site_logistics", "permit_technical",
  "budget_guidance", "missing_info", "contractor_estimate_basis",
] as const;

const SECTION_WEIGHTS: Record<string, number> = {
  project_overview: 10, existing_conditions: 10, room_scope: 15, trade_scope: 20,
  measurements: 15, materials_allowances: 10, site_logistics: 5, permit_technical: 5,
  budget_guidance: 5, missing_info: 5,
};

export type SmartEstimateStatus = "draft" | "in_progress" | "review" | "approved" | "archived";

export function useSmartEstimateList(filters?: { status?: string; estimatorId?: string }) {
  return useQuery({
    queryKey: ["smart-estimates", filters],
    queryFn: async () => {
      let q = supabase
        .from("smart_estimates")
        .select("*, leads(name, project_type, location), projects(client_name)")
        .order("updated_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.estimatorId) q = q.eq("assigned_estimator_id", filters.estimatorId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useSmartEstimate(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["smart-estimate", estimateId],
    enabled: !!estimateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_estimates")
        .select("*, leads(name, project_type, location, email, phone, client_notes)")
        .eq("id", estimateId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSmartEstimateSections(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["smart-estimate-sections", estimateId],
    enabled: !!estimateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_estimate_sections")
        .select("*")
        .eq("smart_estimate_id", estimateId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useSmartEstimateRooms(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["smart-estimate-rooms", estimateId],
    enabled: !!estimateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_estimate_rooms")
        .select("*")
        .eq("smart_estimate_id", estimateId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useSmartEstimateTradeItems(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["smart-estimate-trade-items", estimateId],
    enabled: !!estimateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_estimate_trade_items")
        .select("*")
        .eq("smart_estimate_id", estimateId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useSmartEstimateFiles(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["smart-estimate-files", estimateId],
    enabled: !!estimateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_estimate_files")
        .select("*")
        .eq("smart_estimate_id", estimateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSmartEstimateActivity(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["smart-estimate-activity", estimateId],
    enabled: !!estimateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_estimate_activity_log")
        .select("*")
        .eq("smart_estimate_id", estimateId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useSmartEstimateMutations(estimateId?: string) {
  const qc = useQueryClient();
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["smart-estimate", estimateId] });
    qc.invalidateQueries({ queryKey: ["smart-estimate-sections", estimateId] });
    qc.invalidateQueries({ queryKey: ["smart-estimate-rooms", estimateId] });
    qc.invalidateQueries({ queryKey: ["smart-estimate-trade-items", estimateId] });
    qc.invalidateQueries({ queryKey: ["smart-estimate-files", estimateId] });
    qc.invalidateQueries({ queryKey: ["smart-estimate-activity", estimateId] });
    qc.invalidateQueries({ queryKey: ["smart-estimates"] });
  };

  const createEstimate = useMutation({
    mutationFn: async ({ projectId, leadId, workspaceId }: { projectId?: string; leadId?: string; workspaceId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("smart_estimates")
        .insert({
          project_id: projectId || null,
          lead_id: leadId || null,
          workspace_id: workspaceId || null,
          assigned_estimator_id: user.id,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      // Create default sections
      const sections = SECTION_KEYS.map(key => ({
        smart_estimate_id: data.id,
        section_key: key,
        section_data: {},
      }));
      await supabase.from("smart_estimate_sections").insert(sections);
      // Log
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: data.id, actor_id: user.id, actor_role: "estimator",
        action_type: "estimate_created",
      });
      return data;
    },
    onSuccess: () => { invalidateAll(); toast.success("Smart Estimate created"); },
    onError: (e) => toast.error(e.message),
  });

  const updateEstimate = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!estimateId) throw new Error("No estimate");
      const { error } = await supabase
        .from("smart_estimates")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", estimateId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const updateSection = useMutation({
    mutationFn: async ({ sectionKey, sectionData, isComplete, aiGenerated }: {
      sectionKey: string; sectionData?: any; isComplete?: boolean; aiGenerated?: boolean;
    }) => {
      if (!estimateId) throw new Error("No estimate");
      const { data: { user } } = await supabase.auth.getUser();
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (sectionData !== undefined) updates.section_data = sectionData;
      if (isComplete !== undefined) updates.is_complete = isComplete;
      if (aiGenerated !== undefined) updates.ai_generated = aiGenerated;
      if (user) updates.last_edited_by = user.id;
      
      const { error } = await supabase
        .from("smart_estimate_sections")
        .update(updates)
        .eq("smart_estimate_id", estimateId)
        .eq("section_key", sectionKey);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const addRoom = useMutation({
    mutationFn: async (room: { room_name: string; room_type?: string; floor_level?: string }) => {
      if (!estimateId) throw new Error("No estimate");
      const { data, error } = await supabase
        .from("smart_estimate_rooms")
        .insert({ smart_estimate_id: estimateId, ...room })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const updateRoom = useMutation({
    mutationFn: async ({ roomId, updates }: { roomId: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("smart_estimate_rooms")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", roomId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const deleteRoom = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase.from("smart_estimate_rooms").delete().eq("id", roomId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const addTradeItem = useMutation({
    mutationFn: async (item: { trade_category: string; line_item_name: string; scope_description?: string; quantity?: number; unit?: string; room_id?: string }) => {
      if (!estimateId) throw new Error("No estimate");
      const { data, error } = await supabase
        .from("smart_estimate_trade_items")
        .insert({ smart_estimate_id: estimateId, ...item })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const updateTradeItem = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("smart_estimate_trade_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const deleteTradeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("smart_estimate_trade_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: (e) => toast.error(e.message),
  });

  const logActivity = useMutation({
    mutationFn: async ({ actionType, details }: { actionType: string; details?: any }) => {
      if (!estimateId) return;
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: estimateId,
        actor_id: user?.id,
        actor_role: "admin",
        action_type: actionType,
        action_details: details || {},
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smart-estimate-activity", estimateId] }),
  });

  const submitForReview = useMutation({
    mutationFn: async () => {
      if (!estimateId) throw new Error("No estimate");
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("smart_estimates").update({ status: "review", updated_at: new Date().toISOString() }).eq("id", estimateId);
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: estimateId, actor_id: user?.id, actor_role: "estimator",
        action_type: "submitted_for_review",
      });
    },
    onSuccess: () => { invalidateAll(); toast.success("Estimate submitted for review"); },
    onError: (e) => toast.error(e.message),
  });

  const approveEstimate = useMutation({
    mutationFn: async () => {
      if (!estimateId) throw new Error("No estimate");
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("smart_estimates").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", estimateId);
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: estimateId, actor_id: user?.id, actor_role: "admin",
        action_type: "estimate_approved",
      });
    },
    onSuccess: () => { invalidateAll(); toast.success("Estimate approved"); },
    onError: (e) => toast.error(e.message),
  });

  const requestRevision = useMutation({
    mutationFn: async (notes: string) => {
      if (!estimateId) throw new Error("No estimate");
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("smart_estimates").update({ status: "in_progress", review_notes: notes, updated_at: new Date().toISOString() }).eq("id", estimateId);
      await supabase.from("smart_estimate_activity_log").insert({
        smart_estimate_id: estimateId, actor_id: user?.id, actor_role: "admin",
        action_type: "revision_requested", action_details: { notes },
      });
    },
    onSuccess: () => { invalidateAll(); toast.success("Revision requested"); },
    onError: (e) => toast.error(e.message),
  });

  return {
    createEstimate, updateEstimate, updateSection, addRoom, updateRoom, deleteRoom,
    addTradeItem, updateTradeItem, deleteTradeItem, logActivity,
    submitForReview, approveEstimate, requestRevision,
  };
}

export function calculateCompletionPercent(sections: Array<{ section_key: string; is_complete: boolean }>) {
  let totalWeight = 0;
  let completedWeight = 0;
  for (const s of sections) {
    const w = SECTION_WEIGHTS[s.section_key] || 0;
    totalWeight += w;
    if (s.is_complete) completedWeight += w;
  }
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

export function calculateConfidenceScore(
  sections: Array<{ section_key: string; is_complete: boolean; section_data: any }>,
  roomCount: number,
  tradeItemCount: number,
) {
  let score = 0;
  const hasSection = (key: string) => sections.find(s => s.section_key === key)?.is_complete;
  if (hasSection("measurements")) score += 25;
  if (hasSection("trade_scope")) score += 20;
  if (hasSection("room_scope")) score += 15;
  if (hasSection("permit_technical")) score += 10;
  if (hasSection("materials_allowances")) score += 10;
  if (roomCount > 0) score += 10;
  if (tradeItemCount >= 5) score += 10;
  else if (tradeItemCount > 0) score += 5;
  return Math.min(score, 100);
}

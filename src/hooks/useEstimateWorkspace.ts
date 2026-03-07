import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useEstimateWorkspace(leadId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["estimate-workspace", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimate_workspaces")
        .select("*")
        .eq("lead_id", leadId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const createWorkspace = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("estimate_workspaces")
        .insert({ lead_id: leadId!, estimator_id: user.id, status: "field_mode_in_progress", field_mode_status: "in_progress" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate-workspace", leadId] });
      toast.success("Estimating workspace created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateWorkspace = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!workspace?.id) throw new Error("No workspace");
      const { error } = await supabase
        .from("estimate_workspaces")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", workspace.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimate-workspace", leadId] });
    },
    onError: (e) => toast.error(e.message),
  });

  return { workspace, isLoading, createWorkspace, updateWorkspace };
}

export function useFieldModeRooms(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["field-mode-rooms", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_mode_rooms")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addRoom = useMutation({
    mutationFn: async (roomName: string) => {
      const { data, error } = await supabase
        .from("field_mode_rooms")
        .insert({ workspace_id: workspaceId!, room_name: roomName, sort_order: rooms.length })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["field-mode-rooms", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  const updateRoom = useMutation({
    mutationFn: async ({ roomId, updates }: { roomId: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("field_mode_rooms")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", roomId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["field-mode-rooms", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  const deleteRoom = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase.from("field_mode_rooms").delete().eq("id", roomId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["field-mode-rooms", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  return { rooms, isLoading, addRoom, updateRoom, deleteRoom };
}

export function useBidPacket(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: packet, isLoading } = useQuery({
    queryKey: ["bid-packet", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_packets")
        .select("*, bid_packet_trade_sections(*, bid_packet_line_items(*))")
        .eq("workspace_id", workspaceId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const createPacket = useMutation({
    mutationFn: async ({ leadId, title }: { leadId: string; title: string }) => {
      const { data, error } = await supabase
        .from("bid_packets")
        .insert({ workspace_id: workspaceId!, lead_id: leadId, title })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bid-packet", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  const updatePacket = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!packet?.id) throw new Error("No packet");
      const { error } = await supabase
        .from("bid_packets")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", packet.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bid-packet", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  const addTradeSection = useMutation({
    mutationFn: async ({ trade, sortOrder }: { trade: string; sortOrder: number }) => {
      if (!packet?.id) throw new Error("No packet");
      const { data, error } = await supabase
        .from("bid_packet_trade_sections")
        .insert({ bid_packet_id: packet.id, trade, sort_order: sortOrder })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bid-packet", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  const deleteTradeSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase.from("bid_packet_trade_sections").delete().eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bid-packet", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  const addLineItem = useMutation({
    mutationFn: async ({ sectionId, description, quantity, unit }: { sectionId: string; description: string; quantity: number; unit: string }) => {
      const { data, error } = await supabase
        .from("bid_packet_line_items")
        .insert({ trade_section_id: sectionId, description, quantity, unit })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bid-packet", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  const deleteLineItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("bid_packet_line_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bid-packet", workspaceId] }),
    onError: (e) => toast.error(e.message),
  });

  return { packet, isLoading, createPacket, updatePacket, addTradeSection, deleteTradeSection, addLineItem, deleteLineItem };
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubcontractorMessage {
  id: string;
  project_id: string | null;
  bid_package_id: string | null;
  sender_id: string;
  sender_type: "subcontractor" | "coordinator" | "pm" | "admin";
  message: string;
  attachments: any[];
  created_at: string;
  read_by: string[];
  sender_name?: string;
}

export function useSubcontractorMessages(projectId?: string, bidPackageId?: string) {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ["subcontractor-messages", projectId, bidPackageId],
    queryFn: async () => {
      let query = supabase
        .from("subcontractor_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      if (bidPackageId) {
        query = query.eq("bid_package_id", bidPackageId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SubcontractorMessage[];
    },
    enabled: !!(projectId || bidPackageId),
  });

  // Real-time subscription
  useEffect(() => {
    if (!projectId && !bidPackageId) return;

    const channel = supabase
      .channel("subcontractor-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subcontractor_messages",
        },
        (payload) => {
          queryClient.invalidateQueries({ 
            queryKey: ["subcontractor-messages", projectId, bidPackageId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, bidPackageId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({
      message,
      senderType,
      attachments = [],
    }: {
      message: string;
      senderType: "subcontractor" | "coordinator" | "pm" | "admin";
      attachments?: any[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("subcontractor_messages").insert({
        project_id: projectId,
        bid_package_id: bidPackageId,
        sender_id: userData.user.id,
        sender_type: senderType,
        message,
        attachments,
        read_by: [userData.user.id],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["subcontractor-messages", projectId, bidPackageId] 
      });
    },
    onError: (error) => {
      toast.error("Failed to send message");
      console.error(error);
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const message = messages.find((m) => m.id === messageId);
      if (!message || message.read_by.includes(userData.user.id)) return;

      const updatedReadBy = [...message.read_by, userData.user.id];

      const { error } = await supabase
        .from("subcontractor_messages")
        .update({ read_by: updatedReadBy })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["subcontractor-messages", projectId, bidPackageId] 
      });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    refetch,
  };
}

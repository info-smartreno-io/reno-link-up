import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PipelineLead } from "@/components/pipeline/PipelineLeadCard";
import { useToast } from "@/hooks/use-toast";
import { invalidateAllLeadQueries } from "@/lib/leadQueryUtils";

export function usePipelineLeads() {
  return useQuery({
    queryKey: ["pipeline-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          name,
          email,
          phone,
          location,
          project_type,
          status,
          estimated_budget,
          created_at,
          estimator_id,
          walkthrough_scheduled_at,
          walkthrough_completed_at
        `)
        .not("status", "in", "(on_hold,lost)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch estimator names separately if there are leads with estimator_id
      const leadsWithEstimators = data?.filter((l) => l.estimator_id) || [];
      const estimatorIds = [...new Set(leadsWithEstimators.map((l) => l.estimator_id))];

      let estimatorNames: Record<string, string> = {};

      if (estimatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", estimatorIds);

        if (profiles) {
          estimatorNames = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || "Unknown";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return (data || []).map((lead) => ({
        ...lead,
        estimator_name: lead.estimator_id ? estimatorNames[lead.estimator_id] : undefined,
      })) as PipelineLead[];
    },
  });
}

export function usePipelineActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateLeadStatus = async (
    leadId: string,
    newStatus: string,
    options?: { notes?: string; reason?: string }
  ) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          status: newStatus,
          status_change_notes: options?.notes,
          status_change_reason: options?.reason,
        })
        .eq("id", leadId);

      if (error) throw error;

      // Use centralized invalidation to update all lead-related queries
      invalidateAllLeadQueries(queryClient);
      
      return true;
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
      return false;
    }
  };

  const refreshLeads = () => {
    invalidateAllLeadQueries(queryClient);
  };

  return {
    updateLeadStatus,
    refreshLeads,
  };
}

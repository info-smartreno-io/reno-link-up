import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractorLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  project_type: string;
  status: string;
  estimated_budget: string | null;
  internal_notes: string | null;
  client_notes: string | null;
  source: string | null;
  source_api_key_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useContractorLeads() {
  return useQuery({
    queryKey: ["contractor-leads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch leads that the contractor can see (via RLS policies)
      // This includes leads where user_id matches OR source_api_key_id is linked to their API keys
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContractorLead[];
    },
  });
}

export function useContractorLeadStats() {
  const { data: leads } = useContractorLeads();

  return {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === "new_lead").length || 0,
    inProgress: leads?.filter((l) =>
      ["call_24h", "walkthrough", "scope_sent", "bid_room"].includes(l.status)
    ).length || 0,
    converted: leads?.filter((l) => l.status === "bid_accepted").length || 0,
  };
}

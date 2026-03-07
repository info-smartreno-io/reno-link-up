import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  location: string;
  estimated_budget: number | null;
  square_footage: number | null;
  deadline: string | null;
  bid_deadline: string;
  requirements: any;
  attachments: any;
  created_at: string;
  status: string;
}

export function useOpportunities() {
  return useQuery({
    queryKey: ["contractor-opportunities"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bid_opportunities")
        .select("*")
        .eq("status", "open")
        .eq("open_to_contractors", true)
        .gte("bid_deadline", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Opportunity[];
    },
  });
}

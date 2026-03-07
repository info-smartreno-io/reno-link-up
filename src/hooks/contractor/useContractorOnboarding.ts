import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingData {
  id: string;
  contractor_id: string;
  company_address: string | null;
  years_in_business: number | null;
  crew_size: number | null;
  trades: string[];
  license_verified: boolean;
  insurance_verified: boolean;
  license_document_url: string | null;
  insurance_document_url: string | null;
  w9_url: string | null;
  license_expiry: string | null;
  insurance_expiry: string | null;
  portfolio_uploaded: boolean;
  pricing_template_created: boolean;
  onboarding_status: string;
  onboarding_completion_score: number | null;
}

export function useContractorOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contractor-onboarding"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get contractor_id from contractor_users
      const { data: cu } = await supabase
        .from("contractor_users")
        .select("contractor_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!cu) throw new Error("No contractor found");

      const { data, error } = await supabase
        .from("contractor_onboarding")
        .select("*")
        .eq("contractor_id", cu.contractor_id)
        .single();

      if (error && error.code === "PGRST116") {
        // No onboarding record yet, create one
        const { data: newRecord, error: insertError } = await supabase
          .from("contractor_onboarding")
          .insert({ contractor_id: cu.contractor_id })
          .select()
          .single();
        if (insertError) throw insertError;
        return { ...newRecord, contractor_id: cu.contractor_id } as OnboardingData;
      }
      if (error) throw error;
      return data as OnboardingData;
    },
  });

  const updateOnboarding = useMutation({
    mutationFn: async (updates: Partial<OnboardingData>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: cu } = await supabase
        .from("contractor_users")
        .select("contractor_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!cu) throw new Error("No contractor found");

      const { error } = await supabase
        .from("contractor_onboarding")
        .update(updates as any)
        .eq("contractor_id", cu.contractor_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractor-onboarding"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return { ...query, updateOnboarding };
}

export function useContractorId() {
  return useQuery({
    queryKey: ["contractor-id"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: cu } = await supabase
        .from("contractor_users")
        .select("contractor_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!cu) throw new Error("No contractor found");
      return cu.contractor_id;
    },
  });
}

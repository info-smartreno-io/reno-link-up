import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContractorId } from "@/hooks/contractor/useContractorOnboarding";
import { useToast } from "@/hooks/use-toast";

export interface ContractorProfile {
  id: string;
  name: string;
  legal_name: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  license_number: string | null;
  logo_url: string | null;
  trade_focus: string | null;
  service_areas: string[];
  is_active: boolean;
  business_type: string | null;
  business_phone: string | null;
  business_email: string | null;
  google_business_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  houzz_url: string | null;
  youtube_url: string | null;
  has_office: boolean;
  office_address: string | null;
  office_staff_count: number;
  project_manager_count: number;
  has_in_house_designer: boolean;
  designer_count: number;
  has_dedicated_estimator: boolean;
  lead_foreman_count: number;
  work_type: string;
  uses_subcontractors: boolean;
  subcontracted_trades: string[];
  project_types: string[];
  typical_budget_range: string | null;
  avg_projects_per_year: number | null;
  typical_project_duration: string | null;
  service_zip_codes: string[];
  service_counties: string[];
  is_bonded: boolean;
  google_rating: number | null;
  google_review_count: number | null;
  profile_completion_pct: number;
  workers_comp_verified: boolean;
  crew_size: number | null;
}

export function useContractorProfile() {
  const { data: contractorId } = useContractorId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contractor-profile", contractorId],
    queryFn: async () => {
      if (!contractorId) throw new Error("No contractor ID");
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .eq("id", contractorId)
        .single();
      if (error) throw error;
      return data as unknown as ContractorProfile;
    },
    enabled: !!contractorId,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<ContractorProfile>) => {
      if (!contractorId) throw new Error("No contractor ID");

      // Calculate profile completion
      const merged = { ...query.data, ...updates };
      const completionPct = calculateProfileCompletion(merged as ContractorProfile);

      const { error } = await supabase
        .from("contractors")
        .update({ ...updates, profile_completion_pct: completionPct } as any)
        .eq("id", contractorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractor-profile"] });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return { ...query, updateProfile };
}

function calculateProfileCompletion(p: ContractorProfile): number {
  let filled = 0;
  let total = 10;

  if (p.name) filled++;
  if (p.phone || p.business_phone) filled++;
  if (p.email || p.business_email) filled++;
  if (p.trade_focus) filled++;
  if ((p.service_areas?.length || 0) > 0 || (p.service_zip_codes?.length || 0) > 0) filled++;
  if (p.license_number) filled++;
  if ((p.project_types?.length || 0) > 0) filled++;
  if (p.typical_budget_range) filled++;
  if (p.business_type) filled++;
  if ((p.crew_size || 0) > 0) filled++;

  return Math.round((filled / total) * 100);
}

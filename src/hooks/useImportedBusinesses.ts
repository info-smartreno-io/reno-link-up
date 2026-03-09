import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ImportedBusiness = {
  id: string;
  business_type: string;
  slug: string;
  business_name: string;
  category: string | null;
  primary_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  review_count: number;
  google_place_id: string | null;
  map_link: string | null;
  business_status: string;
  service_area_tags: string[];
  photo_url: string | null;
  claim_status: string;
  is_active: boolean;
  created_at: string;
};

export function useImportedBusinesses(businessType: "contractor" | "designer", city?: string) {
  return useQuery({
    queryKey: ["imported-businesses", businessType, city],
    queryFn: async () => {
      let query = supabase
        .from("imported_businesses")
        .select("*")
        .eq("business_type", businessType)
        .eq("is_active", true)
        .order("google_rating", { ascending: false, nullsFirst: false });

      if (city) {
        query = query.eq("city", city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ImportedBusiness[];
    },
  });
}

export function useImportedBusiness(slug: string) {
  return useQuery({
    queryKey: ["imported-business", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imported_businesses")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as ImportedBusiness | null;
    },
    enabled: !!slug,
  });
}

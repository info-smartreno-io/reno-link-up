import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSlotImage = (slotKey: string, fallbackUrl?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["slot-image", slotKey],
    queryFn: async () => {
      const { data: slot, error } = await supabase
        .from("image_slots")
        .select("*, active_image:image_assets!image_slots_active_image_id_fkey(storage_path)")
        .eq("slot_key", slotKey)
        .single() as any;

      if (error) {
        console.error("Error fetching slot image:", error);
        return null;
      }

      return slot;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const imageUrl = data?.active_image?.storage_path || fallbackUrl || "/placeholder.svg";
  
  return {
    imageUrl,
    slot: data,
    isLoading,
  };
};

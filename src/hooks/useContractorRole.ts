import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContractorUser {
  id: string;
  contractor_id: string;
  role: string;
  title: string | null;
  is_active: boolean;
}

export function useContractorRole() {
  const [contractorUser, setContractorUser] = useState<ContractorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchContractorRole();
  }, []);

  const fetchContractorRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setContractorUser(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contractor_users")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found is ok
          throw error;
        }
        setContractorUser(null);
      } else {
        setContractorUser(data);
      }
    } catch (error) {
      console.error("Error fetching contractor role:", error);
      toast({
        title: "Error",
        description: "Failed to load contractor role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isContractorAdmin = contractorUser?.role === 'contractor_admin';
  const isInsideSales = contractorUser?.role === 'inside_sales';
  const isEstimator = contractorUser?.role === 'estimator';
  const isProjectCoordinator = contractorUser?.role === 'project_coordinator';
  const isProjectManager = contractorUser?.role === 'project_manager';

  return {
    contractorUser,
    loading,
    isContractorAdmin,
    isInsideSales,
    isEstimator,
    isProjectCoordinator,
    isProjectManager,
    refetch: fetchContractorRole,
  };
}

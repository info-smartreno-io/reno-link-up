import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContractorCounts {
  newProjects: number;
  pendingOrders: number;
  totalPending: number;
}

export function useContractorCounts() {
  const [counts, setCounts] = useState<ContractorCounts>({
    newProjects: 0,
    pendingOrders: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch new projects count
      const { count: projectsCount } = await supabase
        .from('contractor_projects')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', user.id)
        .eq('status', 'new');

      // Fetch pending purchase orders count
      const { count: ordersCount } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'pending']);

      const newProjectsCount = projectsCount || 0;
      const pendingOrdersCount = ordersCount || 0;

      setCounts({
        newProjects: newProjectsCount,
        pendingOrders: pendingOrdersCount,
        totalPending: newProjectsCount + pendingOrdersCount,
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Set up real-time listeners for projects
    const projectsChannel = supabase
      .channel('contractor-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contractor_projects'
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // Set up real-time listeners for purchase orders
    const ordersChannel = supabase
      .channel('purchase-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_orders'
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  return { counts, loading };
}

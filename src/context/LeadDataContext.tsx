import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAllLeadQueries } from "@/lib/leadQueryUtils";

interface LeadDataContextType {
  refreshLeads: () => void;
}

const LeadDataContext = createContext<LeadDataContextType | undefined>(undefined);

interface LeadDataProviderProps {
  children: ReactNode;
}

export function LeadDataProvider({ children }: LeadDataProviderProps) {
  const queryClient = useQueryClient();

  const refreshLeads = () => {
    invalidateAllLeadQueries(queryClient);
  };

  useEffect(() => {
    // Subscribe to realtime changes on leads table
    const channel = supabase
      .channel("lead-lifecycle-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          console.log("Lead change detected:", payload.eventType);
          invalidateAllLeadQueries(queryClient);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_activities",
        },
        (payload) => {
          console.log("Lead activity change detected:", payload.eventType);
          invalidateAllLeadQueries(queryClient);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Lead lifecycle realtime subscription active");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <LeadDataContext.Provider value={{ refreshLeads }}>
      {children}
    </LeadDataContext.Provider>
  );
}

export function useLeadData() {
  const context = useContext(LeadDataContext);
  if (context === undefined) {
    throw new Error("useLeadData must be used within a LeadDataProvider");
  }
  return context;
}

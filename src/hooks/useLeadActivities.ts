import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAllLeadQueries } from "@/lib/leadQueryUtils";
export type ActivityType = 
  | "call" 
  | "email" 
  | "note" 
  | "walkthrough_scheduled" 
  | "status_change" 
  | "proposal_sent" 
  | "estimator_assigned"
  | "contact_recorded"
  | "meeting"
  | "site_visit"
  | "other";

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  description: string | null;
  performed_by: string | null;
  performed_at: string;
  metadata: Record<string, any>;
  created_at: string;
  performer_name?: string;
}

export interface ActivityWithProfile extends LeadActivity {
  profiles?: {
    full_name: string | null;
  } | null;
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_activities")
        .select(`
          *,
          profiles:performed_by(full_name)
        `)
        .eq("lead_id", leadId)
        .order("performed_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((activity: any) => ({
        ...activity,
        performer_name: activity.profiles?.full_name || "System",
      })) as LeadActivity[];
    },
    enabled: !!leadId,
  });
}

export function useRecordActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      activityType,
      description,
      metadata = {},
    }: {
      leadId: string;
      activityType: ActivityType;
      description?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lead_activities")
        .insert({
          lead_id: leadId,
          activity_type: activityType,
          description,
          performed_by: user.id,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Use centralized invalidation to update all lead-related queries
      invalidateAllLeadQueries(queryClient);
    },
  });
}

export const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: string; color: string }> = {
  call: { label: "Call", icon: "Phone", color: "text-blue-500" },
  email: { label: "Email", icon: "Mail", color: "text-green-500" },
  note: { label: "Note", icon: "StickyNote", color: "text-yellow-500" },
  walkthrough_scheduled: { label: "Walkthrough Scheduled", icon: "Calendar", color: "text-purple-500" },
  status_change: { label: "Status Change", icon: "ArrowRight", color: "text-orange-500" },
  proposal_sent: { label: "Proposal Sent", icon: "FileText", color: "text-cyan-500" },
  estimator_assigned: { label: "Construction Agent Assigned", icon: "User", color: "text-indigo-500" },
  contact_recorded: { label: "Contact Recorded", icon: "Phone", color: "text-teal-500" },
  meeting: { label: "Meeting", icon: "Users", color: "text-pink-500" },
  site_visit: { label: "Site Visit", icon: "MapPin", color: "text-emerald-500" },
  other: { label: "Other", icon: "MoreHorizontal", color: "text-gray-500" },
};

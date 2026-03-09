import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useHomeownerProjects() {
  return useQuery({
    queryKey: ["homeowner-projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("homeowner_projects")
        .select(`
          id,
          project_id,
          contractor_projects (
            id,
            client_name,
            project_type,
            status,
            start_date,
            estimated_completion,
            contract_value,
            notes,
            created_at,
            updated_at,
            contractor_id
          )
        `)
        .eq("homeowner_id", user.id);

      if (error) throw error;
      return data?.map(hp => ({
        linkId: hp.id,
        ...hp.contractor_projects as any,
      })) || [];
    },
    staleTime: 30000,
    retry: 1,
  });
}

export function useHomeownerProjectDetail(projectId: string | undefined) {
  return useQuery({
    queryKey: ["homeowner-project-detail", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data: project, error } = await supabase
        .from("contractor_projects")
        .select(`
          *,
          project_milestones (
            id, milestone_name, description, status, due_date, completed_at, sequence_order
          )
        `)
        .eq("id", projectId!)
        .single();

      if (error) throw error;

      // Get contractor info
      let contractor = null;
      if (project.contractor_id) {
        const { data: cData } = await supabase
          .from("contractors")
          .select("id, name, owner_name, email, phone")
          .eq("id", project.contractor_id)
          .single();
        if (cData) {
          contractor = {
            id: cData.id,
            company_name: cData.name,
            contact_name: cData.owner_name,
            contact_email: cData.email,
            contact_phone: cData.phone,
          };
        }
      }

      // Get recent daily logs (use project_daily_logs for client-visible entries)
      const { data: logs } = await supabase
        .from("project_daily_logs")
        .select("id, log_date, work_completed, crew_summary, weather, next_steps, created_at")
        .eq("project_id", projectId!)
        .eq("is_client_visible", true)
        .order("log_date", { ascending: false })
        .limit(5);

      // Get timeline tasks
      const { data: tasks } = await supabase
        .from("timeline_tasks")
        .select("id, task_name, start_date, end_date, status, phase")
        .eq("project_id", projectId!)
        .order("start_date", { ascending: true });

      // Get recent activity
      const { data: activities } = await supabase
        .from("project_activity_log")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        project,
        contractor,
        recentLogs: logs || [],
        timelineTasks: tasks || [],
        recentActivity: activities || [],
      };
    },
  });
}

export function useHomeownerProposals(projectId: string | undefined) {
  return useQuery({
    queryKey: ["homeowner-proposals", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      // Get bid opportunities linked to this project
      const { data: opportunities } = await supabase
        .from("bid_opportunities")
        .select("id")
        .eq("project_id", projectId!);

      if (!opportunities?.length) return [];

      const oppIds = opportunities.map(o => o.id);
      const { data: bids, error } = await supabase
        .from("bid_submissions")
        .select(`
          id, bid_amount, estimated_timeline, proposal_text, status, 
          submitted_at, anticipated_start_date, warranty_years,
          bidder_id, bidder_type, attachments,
          project_duration_weeks, crew_size
        `)
        .in("bid_opportunity_id", oppIds)
        .in("status", ["shortlisted", "accepted", "submitted"]);

      if (error) throw error;

      // Enrich with contractor names
      const enriched = await Promise.all((bids || []).map(async (bid) => {
        let contractorName = "Contractor";
        let companyName = "";
        if (bid.bidder_type === "contractor") {
          const { data: c } = await supabase
            .from("contractors")
            .select("name, owner_name")
            .eq("id", bid.bidder_id)
            .single();
          if (c) {
            contractorName = c.owner_name || "Contractor";
            companyName = c.name || "";
          }
        }
        return { ...bid, contractorName, companyName };
      }));

      return enriched;
    },
  });
}

export function useSelectContractor(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bidId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get bid details for notification
      const { data: bid } = await supabase
        .from("bid_submissions")
        .select("bidder_id, bid_amount, bid_opportunity_id")
        .eq("id", bidId)
        .single();

      // Update bid status
      const { error: bidError } = await supabase
        .from("bid_submissions")
        .update({ status: "accepted" })
        .eq("id", bidId);
      if (bidError) throw bidError;

      // Update project status and assign contractor
      if (projectId) {
        const updates: Record<string, any> = { status: "contractor_selected" };
        if (bid?.bidder_id) updates.contractor_id = bid.bidder_id;

        const { error: projError } = await supabase
          .from("contractor_projects")
          .update(updates)
          .eq("id", projectId);
        if (projError) throw projError;

        // Log activity
        await supabase.from("project_activity_log").insert({
          project_id: projectId,
          activity_type: "contractor_selected",
          description: "Homeowner selected a contractor for the project",
          performed_by: user?.id,
          role: "homeowner",
          metadata: { bid_id: bidId, bid_amount: bid?.bid_amount },
        });

        // Notify contractor
        if (bid?.bidder_id) {
          await supabase.from("notifications").insert({
            user_id: bid.bidder_id,
            title: "You've Been Selected!",
            message: "A homeowner has selected you for their project. Check your projects for details.",
            type: "milestone",
            link: `/contractor/projects/${projectId}`,
          });
        }

        // Notify admins
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (admins?.length) {
          const adminNotifs = admins.map(a => ({
            user_id: a.user_id,
            title: "Contractor Selected",
            message: `Homeowner selected a contractor for project. Bid: $${bid?.bid_amount?.toLocaleString()}`,
            type: "milestone" as const,
            link: `/admin/live-projects`,
          }));
          await supabase.from("notifications").insert(adminNotifs);
        }
      }
    },
    onSuccess: () => {
      toast.success("Contractor selected successfully!");
      queryClient.invalidateQueries({ queryKey: ["homeowner-proposals", projectId] });
      queryClient.invalidateQueries({ queryKey: ["homeowner-project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["homeowner-projects"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
    onError: () => toast.error("Failed to select contractor"),
  });
}

// Map internal statuses to homeowner-friendly labels
export const HOMEOWNER_STATUS_MAP: Record<string, { label: string; step: number }> = {
  intake: { label: "Project Submitted", step: 0 },
  new: { label: "Project Submitted", step: 0 },
  needs_info: { label: "Project Submitted", step: 0 },
  payment_confirmed: { label: "Project Submitted", step: 0 },
  paid: { label: "Project Submitted", step: 0 },
  field_visit_needed: { label: "Site Visit Scheduled", step: 1 },
  field_visit_scheduled: { label: "Site Visit Scheduled", step: 1 },
  walkthrough_scheduled: { label: "Site Visit Scheduled", step: 1 },
  walkthrough_complete: { label: "Preparing Your Estimate", step: 2 },
  estimate_in_progress: { label: "Preparing Your Estimate", step: 2 },
  estimating: { label: "Preparing Your Estimate", step: 2 },
  scope_review: { label: "Preparing Your Estimate", step: 2 },
  estimate_ready: { label: "Gathering Proposals", step: 3 },
  ready_for_rfp: { label: "Gathering Proposals", step: 3 },
  estimate_approved: { label: "Gathering Proposals", step: 3 },
  rfp_out: { label: "Gathering Proposals", step: 3 },
  bids_received: { label: "Gathering Proposals", step: 3 },
  homeowner_review: { label: "Waiting for Your Selection", step: 3 },
  contractor_selected: { label: "Contractor Selected", step: 4 },
  contract_signed: { label: "Contractor Selected", step: 4 },
  pre_construction: { label: "Construction Scheduled", step: 5 },
  active: { label: "Construction In Progress", step: 5 },
  in_progress: { label: "Construction In Progress", step: 5 },
  punch_list: { label: "Final Review", step: 6 },
  final_walkthrough: { label: "Final Review", step: 6 },
  complete: { label: "Completed", step: 7 },
  completed: { label: "Completed", step: 7 },
  archived: { label: "Completed", step: 7 },
};

export const HOMEOWNER_MILESTONES = [
  "Project Submitted",
  "Site Visit Scheduled",
  "Preparing Your Estimate",
  "Gathering Proposals",
  "Contractor Selected",
  "Construction In Progress",
  "Final Review",
  "Completed",
];

export function getHomeownerStatus(status: string) {
  return HOMEOWNER_STATUS_MAP[status] || { label: status, step: 0 };
}

export function getNextStep(status: string): string {
  const steps: Record<string, string> = {
    intake: "We're reviewing your project details.",
    new: "We're reviewing your project details.",
    needs_info: "We need some additional information about your project. Please check your messages.",
    payment_confirmed: "Your project is being prepared for site visit scheduling.",
    paid: "Your project is being prepared for site visit scheduling.",
    field_visit_needed: "A site visit will be scheduled to assess your project scope.",
    field_visit_scheduled: "Your site visit is scheduled. We'll assess the project scope.",
    walkthrough_scheduled: "Your site visit is scheduled. We'll assess the project scope.",
    walkthrough_complete: "Our team is preparing a detailed estimate for your project.",
    estimate_in_progress: "Your estimate is being finalized.",
    estimating: "Your estimate is being finalized.",
    scope_review: "Your project scope is under final review.",
    estimate_ready: "Your estimate is ready. Contractor proposals are being gathered.",
    ready_for_rfp: "Your estimate is ready. Contractor proposals are being gathered.",
    estimate_approved: "Contractor proposals are being collected for your review.",
    rfp_out: "Contractor proposals are being collected for your review.",
    bids_received: "Contractor proposals have been received and are being reviewed.",
    homeowner_review: "Please review the contractor proposals and select your preferred contractor.",
    contractor_selected: "Your contractor has been selected. Contract signing is next.",
    contract_signed: "Construction scheduling is underway.",
    pre_construction: "Pre-construction preparations are in progress.",
    active: "Construction is underway. Check daily logs for progress updates.",
    in_progress: "Construction is underway. Check daily logs for progress updates.",
    punch_list: "Final details are being completed.",
    final_walkthrough: "Your final walkthrough is being scheduled.",
    complete: "Your project is complete! Thank you for choosing SmartReno.",
    completed: "Your project is complete! Thank you for choosing SmartReno.",
    archived: "Your project is complete and archived.",
  };
  return steps[status] || "Your project is being processed.";
}

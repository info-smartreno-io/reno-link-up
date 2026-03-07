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
          role,
          contractor_projects (
            id,
            client_name,
            project_type,
            address,
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
        role: hp.role,
        ...hp.contractor_projects as any,
      })) || [];
    },
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
          .select("id, company_name, contact_name, contact_email, contact_phone")
          .eq("id", project.contractor_id)
          .single();
        contractor = cData;
      }

      // Get recent daily logs
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("id, log_date, work_performed, trade, photo_urls, created_at")
        .eq("project_id", projectId!)
        .order("log_date", { ascending: false })
        .limit(5);

      // Get timeline tasks
      const { data: tasks } = await supabase
        .from("timeline_tasks")
        .select("id, task_name, start_date, end_date, status, phase")
        .eq("project_id", projectId!)
        .order("start_date", { ascending: true });

      return { project, contractor, recentLogs: logs || [], timelineTasks: tasks || [] };
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
            .select("company_name, contact_name")
            .eq("id", bid.bidder_id)
            .single();
          if (c) {
            contractorName = c.contact_name || "Contractor";
            companyName = c.company_name || "";
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
      // Update bid status
      const { error: bidError } = await supabase
        .from("bid_submissions")
        .update({ status: "accepted" })
        .eq("id", bidId);
      if (bidError) throw bidError;

      // Update project status
      if (projectId) {
        const { error: projError } = await supabase
          .from("contractor_projects")
          .update({ status: "contractor_selected" })
          .eq("id", projectId);
        if (projError) throw projError;
      }
    },
    onSuccess: () => {
      toast.success("Contractor selected successfully!");
      queryClient.invalidateQueries({ queryKey: ["homeowner-proposals", projectId] });
      queryClient.invalidateQueries({ queryKey: ["homeowner-project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["homeowner-projects"] });
    },
    onError: () => toast.error("Failed to select contractor"),
  });
}

// Map internal statuses to homeowner-friendly labels
export const HOMEOWNER_STATUS_MAP: Record<string, { label: string; step: number }> = {
  intake: { label: "Project Submitted", step: 0 },
  payment_confirmed: { label: "Project Submitted", step: 0 },
  rfp_out: { label: "Gathering Proposals", step: 3 },
  walkthrough_scheduled: { label: "Site Visit Scheduled", step: 1 },
  walkthrough_complete: { label: "Preparing Your Estimate", step: 2 },
  estimating: { label: "Preparing Your Estimate", step: 2 },
  estimate_ready: { label: "Gathering Proposals", step: 3 },
  estimate_approved: { label: "Gathering Proposals", step: 3 },
  contractor_selected: { label: "Contractor Selected", step: 4 },
  contract_signed: { label: "Contractor Selected", step: 4 },
  pre_construction: { label: "Construction Scheduled", step: 5 },
  in_progress: { label: "Construction In Progress", step: 5 },
  punch_list: { label: "Final Review", step: 6 },
  complete: { label: "Completed", step: 7 },
  completed: { label: "Completed", step: 7 },
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
    payment_confirmed: "Your project is being prepared for site visit scheduling.",
    walkthrough_scheduled: "Your site visit is scheduled. We'll assess the project scope.",
    walkthrough_complete: "Our team is preparing a detailed estimate for your project.",
    estimating: "Your estimate is being finalized.",
    estimate_ready: "Your estimate is ready. Contractor proposals are being gathered.",
    estimate_approved: "Contractor proposals are being collected for your review.",
    rfp_out: "Please review the contractor proposals and select your preferred contractor.",
    contractor_selected: "Your contractor has been selected. Contract signing is next.",
    contract_signed: "Construction scheduling is underway.",
    pre_construction: "Pre-construction preparations are in progress.",
    in_progress: "Construction is underway. Check daily logs for progress updates.",
    punch_list: "Final details are being completed.",
    complete: "Your project is complete! Thank you for choosing SmartReno.",
    completed: "Your project is complete! Thank you for choosing SmartReno.",
  };
  return steps[status] || "Your project is being processed.";
}

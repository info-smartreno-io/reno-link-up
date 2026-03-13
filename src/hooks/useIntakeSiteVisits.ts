import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntakeSiteVisitProject {
  id: string;
  project_type: string;
  address: string | null;
  scheduled_visit_at: string | null;
  visit_confirmed: boolean | null;
  user_id: string;
  created_at: string;
  homeowner?: { full_name: string | null; email: string | null; phone: string | null } | null;
  homePreferences?: Record<string, unknown> | null;
  hasDetails: boolean;
  details?: {
    description: string | null;
    measurements: Record<string, unknown> | null;
    materials: Record<string, unknown> | null;
    inspiration_links: string[] | null;
  } | null;
}

async function fetchIntakeSiteVisits(): Promise<IntakeSiteVisitProject[]> {
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, project_type, address, scheduled_visit_at, visit_confirmed, user_id, created_at")
    .eq("visit_confirmed", true)
    .order("scheduled_visit_at", { ascending: true, nullsFirst: false });

  if (projectsError) throw projectsError;
  if (!projects?.length) return [];

  const projectIds = projects.map((p) => p.id);
  const userIds = [...new Set(projects.map((p) => p.user_id).filter(Boolean))];

  const [detailsRes, usersRes] = await Promise.all([
    supabase
      .from("project_details")
      .select("project_id, description, measurements, materials, inspiration_links")
      .in("project_id", projectIds),
    userIds.length
      ? supabase
          .from("users")
          .select("id, full_name, email, phone, home_visit_preferences")
          .in("id", userIds)
      : { data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[], error: null },
  ]);

  if (detailsRes.error) throw detailsRes.error;
  if (usersRes.error) throw usersRes.error;

  const detailsByProject = new Map(
    (detailsRes.data ?? []).map((d) => [d.project_id, d])
  );
  const usersById = new Map(
    (usersRes.data ?? []).map((u) => [u.id, u])
  );

  return projects.map((p) => {
    const details = detailsByProject.get(p.id);
    const userRow = p.user_id ? usersById.get(p.user_id) ?? null : null;
    return {
      ...p,
      homeowner: userRow
        ? {
            full_name: userRow.full_name ?? null,
            email: userRow.email ?? null,
            phone: userRow.phone ?? null,
          }
        : null,
      homePreferences: (userRow?.home_visit_preferences as Record<string, unknown>) ?? null,
      hasDetails: !!details,
      details: details
        ? {
            description: details.description ?? null,
            measurements: (details.measurements as Record<string, unknown>) ?? null,
            materials: (details.materials as Record<string, unknown>) ?? null,
            inspiration_links: details.inspiration_links ?? null,
          }
        : null,
    };
  });
}

export function useIntakeSiteVisits() {
  return useQuery({
    queryKey: ["intake-site-visits"],
    queryFn: fetchIntakeSiteVisits,
  });
}

export async function fetchIntakeProjectDetails(projectId: string): Promise<{
  project: IntakeSiteVisitProject | null;
  details: IntakeSiteVisitProject["details"] | null;
  error: string | null;
}> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, project_type, address, scheduled_visit_at, visit_confirmed, user_id, created_at")
    .eq("id", projectId)
    .eq("visit_confirmed", true)
    .single();

  if (projectError || !project) {
    return { project: null, details: null, error: projectError?.message ?? "Project not found" };
  }

  let homeowner: IntakeSiteVisitProject["homeowner"] = null;
  let homePreferences: IntakeSiteVisitProject["homePreferences"] = null;
  if (project.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("full_name, email, phone, home_visit_preferences")
      .eq("id", project.user_id)
      .single();
    if (user) {
      homeowner = { full_name: user.full_name ?? null, email: user.email ?? null, phone: user.phone ?? null };
      homePreferences = (user.home_visit_preferences as Record<string, unknown>) ?? null;
    }
  }

  const { data: detailRow, error: detailsError } = await supabase
    .from("project_details")
    .select("description, measurements, materials, inspiration_links")
    .eq("project_id", projectId)
    .maybeSingle();

  const details =
    detailRow && !detailsError
      ? {
          description: detailRow.description ?? null,
          measurements: (detailRow.measurements as Record<string, unknown>) ?? null,
          materials: (detailRow.materials as Record<string, unknown>) ?? null,
          inspiration_links: detailRow.inspiration_links ?? null,
        }
      : null;

  const fullProject: IntakeSiteVisitProject = {
    ...project,
    homeowner,
    homePreferences,
    hasDetails: !!detailRow,
    details,
  };

  return { project: fullProject, details, error: detailsError?.message ?? null };
}

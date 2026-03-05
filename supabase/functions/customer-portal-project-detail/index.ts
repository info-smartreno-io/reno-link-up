import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-portal-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const portalToken = req.headers.get('x-portal-token');
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (!portalToken) {
      return new Response(
        JSON.stringify({ error: 'Portal access token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token and check project access
    const { data: access, error: accessError } = await supabase
      .from('homeowner_portal_access')
      .select('*')
      .eq('access_token', portalToken)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (accessError || !access) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch project with related data
    const { data: project, error: projectError } = await supabase
      .from('contractor_projects')
      .select(`
        *,
        project_milestones (
          id,
          milestone_name,
          description,
          status,
          due_date,
          completed_at,
          sequence_order
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment schedules
    const { data: payments } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });

    // Calculate progress from milestones
    const milestones = project.project_milestones || [];
    const completedMilestones = milestones.filter((m: any) => m.status === 'completed').length;
    const percentComplete = milestones.length > 0 
      ? Math.round((completedMilestones / milestones.length) * 100)
      : 0;

    // Get current phase from milestones
    const inProgressMilestone = milestones.find((m: any) => m.status === 'in_progress');
    const currentPhase = inProgressMilestone?.milestone_name || 
      (percentComplete === 100 ? 'Complete' : 'Not Started');

    // Calculate budget summary
    const totalBudget = project.contract_value || 0;
    const paidAmount = payments?.filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
    const nextPayment = payments?.find((p: any) => p.status === 'pending');

    const response = {
      success: true,
      project: {
        id: project.id,
        name: `${project.project_type} - ${project.address}`,
        client_name: project.client_name,
        project_type: project.project_type,
        address: project.address,
        status: project.status,
        percent_complete: percentComplete,
        current_phase: currentPhase,
        timeline: {
          start_date: project.start_date,
          estimated_completion: project.estimated_completion,
          days_remaining: project.estimated_completion 
            ? Math.max(0, Math.ceil((new Date(project.estimated_completion).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null,
        },
        milestones: milestones.map((m: any) => ({
          id: m.id,
          name: m.milestone_name,
          description: m.description,
          status: m.status,
          due_date: m.due_date,
          completed_at: m.completed_at,
          sequence: m.sequence_order,
        })).sort((a: any, b: any) => a.sequence - b.sequence),
        budget: {
          total: totalBudget,
          paid: paidAmount,
          remaining: totalBudget - paidAmount,
          next_payment: nextPayment ? {
            amount: nextPayment.amount,
            due_date: nextPayment.due_date,
            milestone: nextPayment.milestone_name,
          } : null,
        },
        recent_updates: project.notes ? [{ text: project.notes, date: project.updated_at }] : [],
      },
    };

    console.log(`Returning project detail for: ${projectId}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Customer portal project detail error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

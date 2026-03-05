import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-portal-token',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get portal access token from header
    const portalToken = req.headers.get('x-portal-token');
    
    if (!portalToken) {
      return new Response(
        JSON.stringify({ error: 'Portal access token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token and get homeowner info
    const { data: access, error: accessError } = await supabase
      .from('homeowner_portal_access')
      .select('*, contractor_projects(*)')
      .eq('access_token', portalToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (accessError || !access) {
      console.error('Portal token validation failed:', accessError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired portal token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last accessed
    await supabase
      .from('homeowner_portal_access')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', access.id);

    // Get all projects for this homeowner email
    const { data: allAccess, error: projectsError } = await supabase
      .from('homeowner_portal_access')
      .select(`
        project_id,
        contractor_projects (
          id,
          client_name,
          project_type,
          address,
          status,
          start_date,
          estimated_completion,
          contract_value,
          created_at
        )
      `)
      .eq('homeowner_email', access.homeowner_email)
      .eq('is_active', true);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch projects' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform to project list with calculated progress
    const projects = allAccess
      .filter(a => a.contractor_projects)
      .map(a => {
        const project = a.contractor_projects as any;
        
        // Calculate progress based on status
        const statusProgress: Record<string, number> = {
          'pre_construction': 10,
          'permitting': 20,
          'in_progress': 50,
          'punch_list': 90,
          'completed': 100,
        };
        
        return {
          id: project.id,
          name: `${project.project_type} - ${project.address}`,
          client_name: project.client_name,
          project_type: project.project_type,
          address: project.address,
          status: project.status,
          percent_complete: statusProgress[project.status] || 0,
          start_date: project.start_date,
          estimated_completion: project.estimated_completion,
          contract_value: project.contract_value,
        };
      });

    console.log(`Returning ${projects.length} projects for homeowner: ${access.homeowner_email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        homeowner: {
          email: access.homeowner_email,
          name: access.homeowner_name,
        },
        projects 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Customer portal projects error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

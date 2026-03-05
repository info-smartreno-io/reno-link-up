import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const WarrantyClaimSchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  reported_issue_title: z.string().trim().min(5, "Title too short").max(200, "Title too long"),
  reported_issue_desc: z.string().trim().min(10, "Description too short").max(2000, "Description too long"),
  reported_area: z.string().trim().min(1, "Area required").max(100, "Area too long"),
  severity: z.enum(['cosmetic', 'functional', 'structural', 'safety']).default('functional'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth context
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader ?? '' } }
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawData = await req.json();
    
    // Validate input
    const validationResult = WarrantyClaimSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const {
      project_id,
      reported_issue_title,
      reported_issue_desc,
      reported_area,
      severity,
      priority,
    } = validationResult.data;

    console.log('Creating warranty claim for project:', project_id);

    // Create service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get project details and verify user is the homeowner
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('homeowner_id, contractor_id')
      .eq('id', project_id)
      .single();

    if (projectError) throw projectError;

    // Authorization check: user must be the project homeowner
    if (project.homeowner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only create claims for your own projects' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Check if warranty plan exists
    const { data: warrantyPlan } = await supabaseAdmin
      .from('warranty_plans')
      .select('*')
      .eq('project_id', project_id)
      .single();

    // Calculate if within coverage
    let within_coverage = false;
    if (warrantyPlan) {
      const now = new Date();
      const coverageStart = new Date(warrantyPlan.coverage_start);
      const coverageEnd = new Date(warrantyPlan.coverage_end);
      within_coverage = now >= coverageStart && now <= coverageEnd;
    }

    // Generate claim number
    const { data: claimNumber, error: claimNumError } = await supabaseAdmin
      .rpc('generate_claim_number');

    if (claimNumError) throw claimNumError;

    // Create the claim
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('warranty_claims')
      .insert({
        project_id,
        warranty_plan_id: warrantyPlan?.id || null,
        homeowner_id: project.homeowner_id,
        contractor_id: project.contractor_id,
        claim_number: claimNumber,
        reported_issue_title,
        reported_issue_desc,
        reported_area,
        severity,
        priority,
        within_coverage,
        claim_status: 'new',
      })
      .select()
      .single();

    if (claimError) throw claimError;

    // Create initial event
    await supabaseAdmin
      .from('warranty_claim_events')
      .insert({
        claim_id: claim.id,
        actor_id: user.id,
        actor_role: 'homeowner',
        event_type: 'claim_created',
        to_status: 'new',
        message: 'Claim created',
      });

    console.log('Warranty claim created:', claim.claim_number);

    // Send confirmation email to homeowner
    try {
      await supabaseAdmin.functions.invoke('send-warranty-claim-notification', {
        body: {
          claim_id: claim.id,
          new_status: 'new',
          old_status: null,
        },
      });
    } catch (notificationError) {
      console.error('Failed to send confirmation notification:', notificationError);
      // Don't fail claim creation if notification fails
    }

    return new Response(
      JSON.stringify({ claim }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating warranty claim:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

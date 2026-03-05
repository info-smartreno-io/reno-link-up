import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, estimateId } = await req.json();

    if (!projectId) {
      throw new Error('Missing required field: projectId');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project and estimate details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    let estimate = null;
    if (estimateId || project.estimate_id) {
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', estimateId || project.estimate_id)
        .single();

      if (!estimateError && estimateData) {
        estimate = estimateData;
      }
    }

    console.log('Creating RFP for project:', projectId);

    // Create bid opportunity (RFP)
    const bidDeadline = new Date();
    bidDeadline.setDate(bidDeadline.getDate() + 3); // 72 hours from now

    const { data: bidOpportunity, error: bidError } = await supabase
      .from('bid_opportunities')
      .insert({
        project_id: projectId,
        created_by: project.estimator_id,
        title: `${project.project_type} - ${project.project_name}`,
        description: project.description,
        project_type: project.project_type,
        location: `${project.city}, ${project.state} ${project.zip_code}`,
        estimated_budget: estimate?.amount || project.budget_range_max,
        bid_deadline: bidDeadline.toISOString(),
        status: 'open',
        open_to_contractors: true,
        open_to_architects: false,
        open_to_interior_designers: false,
        requirements: estimate?.line_items || [],
        attachments: [],
      })
      .select()
      .single();

    if (bidError) {
      console.error('Error creating bid opportunity:', bidError);
      throw bidError;
    }

    console.log('Created bid opportunity:', bidOpportunity.id);

    // Update project with RFP reference
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        bid_opportunity_id: bidOpportunity.id,
        rfp_created_at: new Date().toISOString(),
        workflow_status: 'rfp_created',
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project:', updateError);
      throw updateError;
    }

    // Send notification to contractors about new RFP
    try {
      await supabase.functions.invoke('send-rfp-notification', {
        body: {
          bidOpportunityId: bidOpportunity.id,
          opportunityTitle: bidOpportunity.title,
          projectType: bidOpportunity.project_type,
          location: bidOpportunity.location,
          estimatedBudget: bidOpportunity.estimated_budget,
          bidDeadline: bidOpportunity.bid_deadline,
          description: bidOpportunity.description,
        }
      });
      console.log('RFP notification sent to contractors');
    } catch (notifError) {
      console.error('Error sending RFP notification:', notifError);
      // Don't fail the RFP creation if notification fails
    }

    // Match contractors based on project type and location
    const { data: contractors, error: contractorsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'contractor');

    if (contractorsError) {
      console.error('Error fetching contractors:', contractorsError);
      throw contractorsError;
    }

    // For MVP: invite all contractors (we'll add smart matching later)
    const matches = contractors?.slice(0, 10).map(c => ({
      bid_opportunity_id: bidOpportunity.id,
      contractor_id: c.user_id,
      match_score: 80, // Default score for now
      match_reasons: ['location_match', 'project_type_match'],
    })) || [];

    if (matches.length > 0) {
      const { error: matchError } = await supabase
        .from('contractor_matches')
        .insert(matches);

      if (matchError) {
        console.error('Error creating contractor matches:', matchError);
        // Don't throw - RFP is created, matching is secondary
      } else {
        console.log(`Created ${matches.length} contractor matches`);
      }
    }

    // TODO: Send notifications to matched contractors
    // This would call send-bid-notification edge function

    return new Response(
      JSON.stringify({ 
        success: true,
        bidOpportunityId: bidOpportunity.id,
        matchedContractors: matches.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating RFP:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
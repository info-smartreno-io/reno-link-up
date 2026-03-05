import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('address, city, state, zip_code')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error('Project not found');

    const zipPrefix = project.zip_code?.substring(0, 3) || '';

    // Get available estimators - filter in memory since we can't use raw SQL in query
    const { data: allEstimators, error: estimatorsError } = await supabase
      .from('estimators')
      .select(`
        id,
        user_id,
        service_zip_codes,
        current_assignments,
        max_assignments,
        is_active
      `)
      .eq('is_active', true);

    if (estimatorsError) throw estimatorsError;

    // Filter estimators with capacity
    const estimators = allEstimators?.filter(e => e.current_assignments < e.max_assignments) || [];

    if (estimatorsError) throw estimatorsError;

    if (!estimators || estimators.length === 0) {
      console.log('No available estimators found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No available estimators at this time' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score and select best estimator
    const scoredEstimators = estimators.map(estimator => {
      let score = 100;

      // Check ZIP code match
      const serviceCodes = estimator.service_zip_codes || [];
      if (serviceCodes.length > 0) {
        const hasMatch = serviceCodes.some((zip: string) => 
          zip.startsWith(zipPrefix) || zipPrefix.startsWith(zip.substring(0, 3))
        );
        if (hasMatch) {
          score += 50; // Bonus for ZIP match
        } else {
          score -= 30; // Penalty for no match
        }
      }

      // Factor in current workload (prefer less busy estimators)
      const workloadPercentage = (estimator.current_assignments / estimator.max_assignments) * 100;
      score -= workloadPercentage * 0.5;

      return {
        ...estimator,
        score
      };
    });

    // Select highest scoring estimator
    scoredEstimators.sort((a, b) => b.score - a.score);
    const selectedEstimator = scoredEstimators[0];

    // Calculate estimated visit time (next business day, 9 AM)
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() + 1);
    // If weekend, push to Monday
    if (visitDate.getDay() === 0) visitDate.setDate(visitDate.getDate() + 1);
    if (visitDate.getDay() === 6) visitDate.setDate(visitDate.getDate() + 2);
    visitDate.setHours(9, 0, 0, 0);

    // Update project with assigned estimator
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        user_id: selectedEstimator.user_id,
        workflow_status: 'estimator_assigned',
        estimator_scheduled_at: visitDate.toISOString()
      })
      .eq('id', projectId);

    if (updateError) throw updateError;

    // Increment estimator's assignment count
    const { error: incrementError } = await supabase
      .from('estimators')
      .update({
        current_assignments: selectedEstimator.current_assignments + 1
      })
      .eq('id', selectedEstimator.id);

    if (incrementError) throw incrementError;

    // Log AI activity
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'scheduling_routing',
        user_id: user?.id || selectedEstimator.user_id,
        user_role: 'estimator',
        project_id: projectId,
        input: {
          zipCode: project.zip_code,
          availableEstimators: estimators.length
        },
        output: {
          selectedEstimatorId: selectedEstimator.user_id,
          estimatedVisitTime: visitDate.toISOString(),
          score: selectedEstimator.score,
          reason: 'Auto-assigned based on ZIP code and availability'
        },
        status: 'completed'
      });

    console.log('Assigned estimator:', selectedEstimator.user_id, 'to project:', projectId);

    return new Response(
      JSON.stringify({
        success: true,
        estimatorId: selectedEstimator.user_id,
        scheduledVisit: visitDate.toISOString(),
        message: 'Estimator assigned successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-scheduling-routing:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

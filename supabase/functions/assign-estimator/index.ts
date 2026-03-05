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
    const { leadId, projectId } = await req.json();
    
    // Support both lead and project assignment
    const targetId = leadId || projectId;
    const targetTable = leadId ? 'leads' : 'projects';

    if (!targetId) {
      throw new Error('Missing required field: leadId or projectId');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lead/project details
    const { data: target, error: targetError } = await supabase
      .from(targetTable)
      .select('*')
      .eq('id', targetId)
      .single();

    if (targetError || !target) {
      throw new Error(`${targetTable} not found`);
    }

    // Skip if already assigned
    if (target.estimator_id) {
      console.log(`${targetTable} ${targetId} already has estimator assigned:`, target.estimator_id);
      return new Response(
        JSON.stringify({ 
          success: true,
          skipped: true,
          reason: 'Already assigned',
          estimatorId: target.estimator_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Extract location info - leads use 'location', projects use 'zip_code' or similar
    const locationField = target.location || target.zip_code || '';
    const zipMatch = locationField.match(/\d{5}/);
    const zipCode = zipMatch ? zipMatch[0] : '';
    const zipPrefix = zipCode.substring(0, 3);
    
    const projectType = (target.project_type || '').toLowerCase();

    console.log('Assigning estimator for:', targetTable, targetId);
    console.log('Project type:', projectType);
    console.log('Location/ZIP:', locationField, '-> prefix:', zipPrefix);

    // Find available estimators with capacity
    const { data: estimators, error: estimatorsError } = await supabase
      .from('estimators')
      .select('*')
      .eq('is_active', true)
      .order('current_assignments', { ascending: true });

    if (estimatorsError) {
      throw estimatorsError;
    }

    if (!estimators || estimators.length === 0) {
      console.error('No active estimators found');
      throw new Error('No available estimators');
    }

    // Filter estimators with capacity
    const availableEstimators = estimators.filter(est => 
      est.current_assignments < (est.max_assignments || 10)
    );

    if (availableEstimators.length === 0) {
      console.error('All estimators at capacity');
      throw new Error('All estimators at capacity');
    }

    // Scoring function: specialty match + ZIP match = highest priority
    const scoredEstimators = availableEstimators.map(est => {
      let score = 0;
      
      // Check specialty/trade match
      const specializations = (est.specializations || []).map((s: string) => s.toLowerCase());
      const hasSpecialtyMatch = projectType && specializations.some((spec: string) => 
        projectType.includes(spec) || spec.includes(projectType)
      );
      if (hasSpecialtyMatch) {
        score += 10; // High priority for specialty match
      }

      // Check ZIP match
      const serviceZips = est.service_zip_codes || [];
      const hasZipMatch = zipPrefix && serviceZips.some((zip: string) => 
        zip.startsWith(zipPrefix) || zipPrefix.startsWith(zip.substring(0, 3))
      );
      if (hasZipMatch) {
        score += 5; // Medium priority for ZIP match
      }

      // Lower score for higher current assignments (load balancing)
      score -= (est.current_assignments || 0) * 0.5;

      return { ...est, score, hasSpecialtyMatch, hasZipMatch };
    });

    // Sort by score (highest first)
    scoredEstimators.sort((a, b) => b.score - a.score);

    const selectedEstimator = scoredEstimators[0];
    
    console.log('Scored estimators:', scoredEstimators.map(e => ({
      user_id: e.user_id,
      score: e.score,
      hasSpecialtyMatch: e.hasSpecialtyMatch,
      hasZipMatch: e.hasZipMatch,
      current_assignments: e.current_assignments
    })));
    
    console.log('Selected estimator:', selectedEstimator.user_id, 
      'Score:', selectedEstimator.score,
      'Specialty match:', selectedEstimator.hasSpecialtyMatch,
      'ZIP match:', selectedEstimator.hasZipMatch
    );

    // Update the lead/project with assigned estimator
    const { error: updateError } = await supabase
      .from(targetTable)
      .update({
        estimator_id: selectedEstimator.user_id,
        status: targetTable === 'leads' ? 'estimator_assigned' : target.status,
      })
      .eq('id', targetId);

    if (updateError) {
      throw updateError;
    }

    // Increment estimator's current assignments
    const { data: currentEst } = await supabase
      .from('estimators')
      .select('current_assignments')
      .eq('user_id', selectedEstimator.user_id)
      .single();

    if (currentEst) {
      await supabase
        .from('estimators')
        .update({ current_assignments: (currentEst.current_assignments || 0) + 1 })
        .eq('user_id', selectedEstimator.user_id);
    }

    console.log('Successfully assigned estimator:', selectedEstimator.user_id, 'to', targetTable, targetId);

    return new Response(
      JSON.stringify({ 
        success: true,
        estimatorId: selectedEstimator.user_id,
        targetTable,
        targetId,
        zipPrefix,
        projectType,
        matchDetails: {
          specialtyMatch: selectedEstimator.hasSpecialtyMatch,
          zipMatch: selectedEstimator.hasZipMatch,
          score: selectedEstimator.score
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error assigning estimator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

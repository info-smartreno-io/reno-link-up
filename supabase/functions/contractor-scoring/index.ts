import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contractor_lead_id } = await req.json();

    // Get contractor lead
    const { data: lead, error: leadError } = await supabase
      .from('contractor_leads')
      .select('*')
      .eq('id', contractor_lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error('Contractor lead not found');
    }

    // Calculate quality score (0-100)
    let score = 0;
    let factors: Record<string, number> = {};

    // 1. Review Count (20 points max)
    const reviewScore = Math.min((lead.review_count || 0) / 50 * 20, 20);
    score += reviewScore;
    factors.reviews = reviewScore;

    // 2. Average Rating (25 points max)
    if (lead.average_rating) {
      const ratingScore = (lead.average_rating / 5.0) * 25;
      score += ratingScore;
      factors.rating = ratingScore;
    }

    // 3. Website Quality (15 points max)
    if (lead.website_quality_score) {
      const websiteScore = (lead.website_quality_score / 100) * 15;
      score += websiteScore;
      factors.website = websiteScore;
    }

    // 4. Years in Business (15 points max)
    if (lead.years_in_business) {
      const yearsScore = Math.min(lead.years_in_business / 20 * 15, 15);
      score += yearsScore;
      factors.experience = yearsScore;
    }

    // 5. License & Insurance (15 points max)
    if (lead.license_number) {
      score += 7.5;
      factors.license = 7.5;
    }
    if (lead.insurance_verified) {
      score += 7.5;
      factors.insurance = 7.5;
    }

    // 6. SEO Ranking (10 points max)
    if (lead.seo_ranking_page) {
      // Page 2-3 = 10 points, Page 4-5 = 5 points
      const rankingScore = lead.seo_ranking_page <= 3 ? 10 : 5;
      score += rankingScore;
      factors.seo = rankingScore;
    }

    // Round to integer
    const finalScore = Math.round(score);

    // Determine recommendation
    const recommended = finalScore >= 60;
    const priority = finalScore >= 80 ? 'high' : finalScore >= 60 ? 'medium' : 'low';

    // Update contractor lead with score
    const { error: updateError } = await supabase
      .from('contractor_leads')
      .update({
        quality_score: finalScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractor_lead_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        contractor_lead_id,
        quality_score: finalScore,
        score_factors: factors,
        recommended,
        priority,
        message: `Quality score calculated: ${finalScore}/100 (${priority} priority)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in contractor-scoring:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

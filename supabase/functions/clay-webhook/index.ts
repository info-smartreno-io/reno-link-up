import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('Clay webhook received:', payload);

    // Extract contractor data from Clay payload
    const contractorData = {
      contractor_name: payload.company_name || payload.name,
      contact_name: payload.contact_name,
      email: payload.email,
      phone: payload.phone,
      service_areas: payload.service_areas || [payload.city, payload.state].filter(Boolean),
      specialties: payload.specialties || payload.services || [],
      license_number: payload.license_number,
      average_rating: payload.rating,
      review_count: payload.review_count,
      scraped_source: 'clay',
      scrape_data: payload,
      seo_ranking_page: payload.search_rank,
      quality_score: calculateQualityScore(payload),
      outreach_status: 'new',
    };

    // Insert into contractor_leads
    const { data, error } = await supabase
      .from('contractor_leads')
      .insert(contractorData as any)
      .select()
      .single();

    if (error) {
      console.error('Error inserting contractor lead:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger auto-scoring and outreach
    await supabase.functions.invoke('contractor-scoring', {
      body: { leadId: data.id },
    });

    return new Response(
      JSON.stringify({ success: true, lead_id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Clay webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateQualityScore(data: any): number {
  let score = 50;
  
  if (data.license_number) score += 10;
  if (data.insurance_verified) score += 10;
  if (data.review_count > 10) score += 15;
  if (data.rating >= 4.5) score += 15;
  if (data.years_in_business > 5) score += 10;
  if (data.website) score += 5;
  if (data.search_rank <= 3) score += 10;
  
  return Math.min(score, 100);
}

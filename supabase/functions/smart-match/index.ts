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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contractor_id, bid_opportunity_id } = await req.json();

    if (!contractor_id) {
      throw new Error('contractor_id is required');
    }

    // Get contractor profile
    const { data: contractor, error: cErr } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', contractor_id)
      .single();

    if (cErr || !contractor) throw new Error('Contractor not found');

    // Get opportunities - either one specific or all open
    let opportunities: any[] = [];
    if (bid_opportunity_id) {
      const { data, error } = await supabase
        .from('bid_opportunities')
        .select('*')
        .eq('id', bid_opportunity_id)
        .single();
      if (error) throw error;
      opportunities = [data];
    } else {
      const { data, error } = await supabase
        .from('bid_opportunities')
        .select('*')
        .eq('status', 'open')
        .eq('open_to_contractors', true)
        .gte('bid_deadline', new Date().toISOString());
      if (error) throw error;
      opportunities = data || [];
    }

    const results: any[] = [];

    for (const opp of opportunities) {
      let tradeScore = 0;
      let locationScore = 0;
      let budgetScore = 0;
      let typeScore = 0;
      let capacityScore = 0;

      // 1. Trade Match (0-30 points)
      const contractorTrades = (contractor.project_types || []).map((t: string) => t.toLowerCase());
      const tradeFocus = (contractor.trade_focus || '').toLowerCase();
      const oppType = (opp.project_type || '').toLowerCase();

      if (contractorTrades.length > 0) {
        const exactMatch = contractorTrades.some((t: string) => oppType.includes(t) || t.includes(oppType));
        tradeScore = exactMatch ? 30 : 0;
        // Partial match via trade_focus
        if (!exactMatch && tradeFocus && (oppType.includes(tradeFocus) || tradeFocus.includes(oppType) || tradeFocus === 'general')) {
          tradeScore = tradeFocus === 'general' ? 15 : 20;
        }
      } else if (tradeFocus) {
        if (oppType.includes(tradeFocus) || tradeFocus.includes(oppType)) tradeScore = 25;
        else if (tradeFocus === 'general') tradeScore = 15;
      }

      // 2. Location Match (0-25 points)
      const serviceAreas = (contractor.service_areas || []).map((a: string) => a.toLowerCase());
      const serviceZips = (contractor.service_zip_codes || []).map((z: string) => z.toLowerCase());
      const serviceCounties = (contractor.service_counties || []).map((c: string) => c.toLowerCase());
      const oppLocation = (opp.location || '').toLowerCase();

      if (serviceAreas.length > 0 || serviceZips.length > 0 || serviceCounties.length > 0) {
        const areaMatch = serviceAreas.some((a: string) => oppLocation.includes(a) || a.includes(oppLocation));
        const zipMatch = serviceZips.some((z: string) => oppLocation.includes(z));
        const countyMatch = serviceCounties.some((c: string) => oppLocation.includes(c));
        locationScore = (areaMatch || zipMatch || countyMatch) ? 25 : 0;
      } else {
        locationScore = 10; // No areas set = moderate default
      }

      // 3. Budget Match (0-20 points)
      const budgetRange = contractor.typical_budget_range;
      const oppBudget = opp.estimated_budget;

      if (budgetRange && oppBudget) {
        const ranges: Record<string, [number, number]> = {
          '$5k – $25k': [5000, 25000],
          '$25k – $75k': [25000, 75000],
          '$75k – $150k': [75000, 150000],
          '$150k – $300k': [150000, 300000],
          '$300k+': [300000, 10000000],
        };
        const [min, max] = ranges[budgetRange] || [0, 10000000];
        if (oppBudget >= min && oppBudget <= max) budgetScore = 20;
        else if (oppBudget >= min * 0.5 && oppBudget <= max * 1.5) budgetScore = 10;
        else budgetScore = 3;
      } else {
        budgetScore = 10;
      }

      // 4. Project Type Match (0-15 points)
      if (contractorTrades.length > 0) {
        const typeMatch = contractorTrades.some((t: string) => oppType.includes(t) || t.includes(oppType));
        typeScore = typeMatch ? 15 : 0;
      } else {
        typeScore = 5;
      }

      // 5. Capacity Score (0-10 points)
      const crewSize = contractor.crew_size || 0;
      const sqft = opp.square_footage || 0;
      if (crewSize >= 10) capacityScore = 10;
      else if (crewSize >= 5) capacityScore = 7;
      else if (crewSize >= 2) capacityScore = 4;
      else capacityScore = 2;

      const totalScore = Math.min(tradeScore + locationScore + budgetScore + typeScore + capacityScore, 100);

      // Upsert match score
      const { error: upsertErr } = await supabase
        .from('contractor_opportunity_matches')
        .upsert({
          contractor_id,
          bid_opportunity_id: opp.id,
          match_score: totalScore,
          trade_score: tradeScore,
          location_score: locationScore,
          budget_score: budgetScore,
          type_score: typeScore,
          capacity_score: capacityScore,
          calculated_at: new Date().toISOString(),
        }, { onConflict: 'contractor_id,bid_opportunity_id' });

      if (upsertErr) console.error('Upsert error:', upsertErr);

      results.push({
        bid_opportunity_id: opp.id,
        match_score: totalScore,
        trade_score: tradeScore,
        location_score: locationScore,
        budget_score: budgetScore,
        type_score: typeScore,
        capacity_score: capacityScore,
      });
    }

    return new Response(
      JSON.stringify({ success: true, matches: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Smart match error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

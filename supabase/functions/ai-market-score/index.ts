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
    const { state, metroArea, county } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    console.log("Scoring market opportunity for:", state, metroArea);

    const prompt = `Evaluate market opportunity for SmartReno expansion.

State: ${state}
Metro Area: ${metroArea || 'N/A'}
County: ${county || 'N/A'}

Analyze:
- Renovation demand score (1-100)
- Age of housing stock
- Median home values
- Renovation volume trends
- Contractor competition level
- Insurance claim density
- Population growth
- Disposable income levels

Return JSON with market analysis:
{
  "opportunity_score": 85,
  "renovation_demand_score": 78,
  "housing_stock_age": 45.5,
  "median_home_value": 425000,
  "renovation_volume_trend": "increasing",
  "contractor_competition_level": "moderate",
  "expansion_priority": 1,
  "market_analysis": {
    "strengths": [
      "High median home values",
      "Aging housing stock",
      "Growing population"
    ],
    "opportunities": [
      "Kitchen remodels in high demand",
      "Strong HELOC market"
    ],
    "challenges": [
      "Moderate contractor competition"
    ]
  },
  "recommendation": "High priority market - strong fundamentals and growth potential"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let marketScore;
    try {
      marketScore = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) marketScore = JSON.parse(jsonMatch[1]);
      else throw new Error('Failed to parse AI response');
    }

    // Store market score
    await supabase.from('market_opportunity_scores').upsert({
      state,
      metro_area: metroArea,
      county,
      opportunity_score: marketScore.opportunity_score,
      renovation_demand_score: marketScore.renovation_demand_score,
      housing_stock_age: marketScore.housing_stock_age,
      median_home_value: marketScore.median_home_value,
      renovation_volume_trend: marketScore.renovation_volume_trend,
      contractor_competition_level: marketScore.contractor_competition_level,
      expansion_priority: marketScore.expansion_priority,
      market_analysis: marketScore.market_analysis
    });

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'market_opportunity_score',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { state, metroArea, county },
      output: marketScore
    });

    return new Response(JSON.stringify(marketScore), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in ai-market-score:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

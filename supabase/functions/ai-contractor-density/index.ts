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
    const { state, county } = await req.json();

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

    console.log("Analyzing contractor density for:", state, county);

    const prompt = `Analyze contractor network coverage and density.

State: ${state}
County: ${county || 'N/A'}

Evaluate:
- Contractor count by trade
- Coverage level (excellent/good/fair/poor)
- Average ratings and responsiveness
- Areas lacking coverage
- Oversaturated markets
- Recruiting priorities

Return JSON with density analysis by trade:
{
  "density_by_trade": [
    {
      "trade": "General Contractor",
      "contractor_count": 45,
      "coverage_level": "good",
      "rating_average": 4.2,
      "responsiveness_score": 0.85,
      "recruiting_priority": "low"
    },
    {
      "trade": "HVAC",
      "contractor_count": 12,
      "coverage_level": "poor",
      "rating_average": 3.8,
      "responsiveness_score": 0.65,
      "recruiting_priority": "high"
    }
  ],
  "recommendations": [
    "Recruit HVAC contractors in this region",
    "Good coverage for general contractors"
  ]
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
    
    let densityAnalysis;
    try {
      densityAnalysis = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) densityAnalysis = JSON.parse(jsonMatch[1]);
      else throw new Error('Failed to parse AI response');
    }

    // Store density data
    for (const trade of densityAnalysis.density_by_trade || []) {
      await supabase.from('contractor_density_map').upsert({
        state,
        county,
        trade: trade.trade,
        contractor_count: trade.contractor_count,
        coverage_level: trade.coverage_level,
        rating_average: trade.rating_average,
        responsiveness_score: trade.responsiveness_score,
        recruiting_priority: trade.recruiting_priority
      });
    }

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'contractor_density',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { state, county },
      output: densityAnalysis
    });

    return new Response(JSON.stringify(densityAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in ai-contractor-density:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
    const { state, county, city } = await req.json();

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

    console.log("Calculating regional cost model for:", state, county, city);

    const prompt = `Analyze regional construction costs for this location.

State: ${state}
County: ${county || 'N/A'}
City: ${city || 'N/A'}

Calculate cost multipliers based on:
- Local labor rates vs national average
- Material pricing (transportation, local supply)
- Permit fees and local regulations
- Disposal and dump fees
- Seasonality (weather impacts, busy season)

Return JSON:
{
  "labor_multiplier": 1.15,
  "material_multiplier": 1.08,
  "permit_fee_multiplier": 1.20,
  "disposal_fee_multiplier": 1.05,
  "seasonal_factors": {
    "winter": 1.10,
    "spring": 1.05,
    "summer": 1.00,
    "fall": 1.02
  },
  "notes": "Northeast region has higher labor costs, winter weather delays"
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
    
    let costModel;
    try {
      costModel = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) costModel = JSON.parse(jsonMatch[1]);
      else throw new Error('Failed to parse AI response');
    }

    // Store cost index
    await supabase.from('regional_cost_index').upsert({
      state,
      county,
      city,
      labor_multiplier: costModel.labor_multiplier,
      material_multiplier: costModel.material_multiplier,
      permit_fee_multiplier: costModel.permit_fee_multiplier,
      disposal_fee_multiplier: costModel.disposal_fee_multiplier,
      seasonal_factors: costModel.seasonal_factors
    }, { onConflict: 'state,county,city' });

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'regional_cost_model',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { state, county, city },
      output: costModel
    });

    return new Response(JSON.stringify(costModel), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in ai-region-cost-model:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

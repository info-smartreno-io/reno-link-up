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
    const { state, county, municipality, inspectionType } = await req.json();

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

    console.log("Predicting inspection delays for:", state, municipality, inspectionType);

    const prompt = `Predict inspection delays and timeline risks.

State: ${state}
County: ${county || 'N/A'}
Municipality: ${municipality || 'N/A'}
Inspection Type: ${inspectionType}

Analyze:
- Current inspector backlog
- Average wait times
- Seasonal patterns
- Labor shortages
- HOA approval delays
- Peak delay months
- Historical data

Return JSON:
{
  "average_wait_days": 7,
  "predicted_delay_days": 10,
  "inspector_backlog_level": "moderate",
  "peak_delay_months": ["June", "July", "August"],
  "seasonal_variation": {
    "winter": 5,
    "spring": 8,
    "summer": 12,
    "fall": 6
  },
  "risk_factors": [
    "Summer construction season increases delays",
    "Limited inspector staff"
  ],
  "recommendations": [
    "Schedule inspections early in week",
    "Avoid July-August if possible",
    "Add 3-day buffer to timeline"
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
    
    let delayPrediction;
    try {
      delayPrediction = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) delayPrediction = JSON.parse(jsonMatch[1]);
      else throw new Error('Failed to parse AI response');
    }

    // Store delay patterns
    await supabase.from('inspection_delay_patterns').upsert({
      state,
      county,
      municipality,
      inspection_type: inspectionType,
      average_wait_days: delayPrediction.average_wait_days,
      seasonal_variation: delayPrediction.seasonal_variation,
      inspector_backlog_level: delayPrediction.inspector_backlog_level,
      peak_delay_months: delayPrediction.peak_delay_months,
      predicted_delay_days: delayPrediction.predicted_delay_days
    });

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'inspection_delay',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { state, municipality, inspectionType },
      output: delayPrediction
    });

    return new Response(JSON.stringify(delayPrediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in ai-inspection-delay:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

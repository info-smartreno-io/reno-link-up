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
    const {
      contractorId,
      calendar = [],
      projectLoad = [],
      crewCount = 1,
      historicalPatterns = []
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    console.log("Calculating availability for contractor:", contractorId);

    const prompt = `Predict contractor availability based on:

Contractor ID: ${contractorId}
Calendar: ${JSON.stringify(calendar)}
Current Project Load: ${JSON.stringify(projectLoad)}
Crew Count: ${crewCount}
Historical Patterns: ${JSON.stringify(historicalPatterns)}

Return JSON with availability score (0-1), next open window, and recommended project types:
{
  "availability_score": 0.78,
  "next_open_window": "2025-03-07",
  "recommended_project_types": ["bathrooms", "small additions"]
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

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let availabilityResult;
    try {
      availabilityResult = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        availabilityResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Cache availability
    await supabase.from('contractor_availability_cache').upsert({
      contractor_id: contractorId,
      availability_score: availabilityResult.availability_score,
      next_open_window: availabilityResult.next_open_window,
      recommended_project_types: availabilityResult.recommended_project_types,
      calendar_data: calendar,
      crew_count: crewCount,
      current_load: projectLoad.length
    }, { onConflict: 'contractor_id' });

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'contractor_availability',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { contractorId },
      output: availabilityResult
    });

    return new Response(
      JSON.stringify(availabilityResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-contractor-availability:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

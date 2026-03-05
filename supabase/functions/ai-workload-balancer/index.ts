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
      contractorPool = [],
      projectAssignments = [],
      availabilityScores = [],
      performanceScores = []
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

    console.log("Balancing workload across contractors");

    const prompt = `Balance contractor workload fairly and effectively.

Contractor Pool: ${JSON.stringify(contractorPool)}
Current Assignments: ${JSON.stringify(projectAssignments)}
Availability Scores: ${JSON.stringify(availabilityScores)}
Performance Scores: ${JSON.stringify(performanceScores)}

Return JSON with recommended load distribution:
{
  "recommended_load_distribution": [
    {"contractorId": "C1", "recommendedProjects": 2},
    {"contractorId": "C9", "recommendedProjects": 5}
  ],
  "balancing_notes": "Shift two Passaic County projects from C1 to C9"
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
    
    let balancerResult;
    try {
      balancerResult = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        balancerResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Log balancing recommendation
    await supabase.from('workload_balancer_logs').insert({
      contractor_pool: contractorPool,
      recommended_distribution: balancerResult.recommended_load_distribution,
      balancing_notes: balancerResult.balancing_notes,
      applied: false
    });

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'workload_balancer',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { contractorPool },
      output: balancerResult
    });

    return new Response(
      JSON.stringify(balancerResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-workload-balancer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

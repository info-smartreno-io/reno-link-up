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
      projectId,
      rankedContractors = [],
      performanceScores = [],
      availabilityScores = []
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

    console.log("Final match ranking for project:", projectId);

    const prompt = `Create final contractor ranking with explanations.

Project ID: ${projectId}
Ranked Contractors: ${JSON.stringify(rankedContractors)}
Performance Scores: ${JSON.stringify(performanceScores)}
Availability Scores: ${JSON.stringify(availabilityScores)}

Return JSON:
{
  "final_recommendations": [
    {"contractorId": "C1", "score": 94},
    {"contractorId": "C7", "score": 89}
  ],
  "high_risk_contractors": ["C12"],
  "explanations": [
    "C1 has high performance and availability",
    "C7 matches project type and budget"
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

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let rankingResult;
    try {
      rankingResult = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        rankingResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Store match scores
    for (const rec of rankingResult.final_recommendations) {
      await supabase.from('match_scores').insert({
        project_id: projectId,
        contractor_id: rec.contractorId,
        final_score: rec.score,
        orchestrator_score: rec.score,
        match_reason: rankingResult.explanations.join('; ')
      });
    }

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'match_ranking_v2',
      user_id: user.id,
      user_role: 'admin',
      project_id: projectId,
      status: 'completed',
      input: { projectId },
      output: rankingResult
    });

    return new Response(
      JSON.stringify(rankingResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-match-ranking-v2:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
      projectHistory = [],
      tradeExpertise = [],
      bids = [],
      ratings = []
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

    console.log("Building skill graph for contractor:", contractorId);

    const prompt = `Analyze this contractor's performance and create a skill graph.

Contractor ID: ${contractorId}
Project History: ${JSON.stringify(projectHistory)}
Trade Expertise: ${JSON.stringify(tradeExpertise)}
Bids: ${JSON.stringify(bids)}
Ratings: ${JSON.stringify(ratings)}

Return JSON:
{
  "skills": ["Tile", "Kitchen Remodels", "Drywall"],
  "optimal_budgets": ["$25k-$75k"],
  "ideal_zip_codes": ["07601", "07450"],
  "recommendations": [
    "Send all kitchens in 07601 to this contractor first"
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
    
    let skillGraph;
    try {
      skillGraph = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        skillGraph = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Store skill graph
    const graphId = crypto.randomUUID();
    await supabase.from('contractor_skill_graphs').upsert({
      contractor_id: contractorId,
      skills: skillGraph.skills,
      optimal_budgets: skillGraph.optimal_budgets,
      ideal_zip_codes: skillGraph.ideal_zip_codes,
      graph_data: skillGraph,
      recommendations: skillGraph.recommendations
    }, { onConflict: 'contractor_id' });

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'contractor_skill_graph',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { contractorId },
      output: { ...skillGraph, graphId }
    });

    return new Response(
      JSON.stringify({ ...skillGraph, graphId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-contractor-skill-graph:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

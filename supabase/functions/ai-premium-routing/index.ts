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
      contractorPool = [],
      contractorScores = {},
      budget = "",
      location = "",
      preferredTrades = []
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

    console.log("Routing project with premium priority:", projectId);

    // Fetch contractor subscriptions
    const contractorSubscriptions: Record<string, string> = {};
    for (const contractorId of contractorPool) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", contractorId)
        .eq("status", "active")
        .single();
      
      contractorSubscriptions[contractorId] = sub?.plan || "free";
    }

    // Build AI prompt
    const prompt = `You are a contractor routing optimization AI.

Rank these contractors for a project, giving priority to Pro+ subscribers:

Project ID: ${projectId}
Budget: ${budget}
Location: ${location}
Preferred Trades: ${preferredTrades.join(", ")}

Contractors:
${contractorPool.map((id: string) => `
- ID: ${id}
  Plan: ${contractorSubscriptions[id]}
  Score: ${contractorScores[id] || "N/A"}
`).join("\n")}

Return JSON with ranked contractors, giving BOOST to Pro+ and Enterprise:
{
  "priority_list": [
    {"contractorId": "145", "priority": 1},
    {"contractorId": "289", "priority": 2}
  ],
  "reasoning": "Pro+ contractors prioritized with strong performance",
  "boost_applied": true
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let routingResult;
    try {
      routingResult = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        routingResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Premium routing result:', routingResult);

    // Save routing logs
    for (const item of routingResult.priority_list || []) {
      await supabase.from('premium_routing_logs').insert({
        project_id: projectId,
        contractor_id: item.contractorId,
        priority_score: item.priority,
        boost_applied: contractorSubscriptions[item.contractorId] !== 'free',
        reasoning: routingResult.reasoning
      });
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'premium_routing',
        user_id: user.id,
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, contractorPool, budget, location },
        output: routingResult,
        premium_boost_applied: routingResult.boost_applied
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(routingResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-premium-routing:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

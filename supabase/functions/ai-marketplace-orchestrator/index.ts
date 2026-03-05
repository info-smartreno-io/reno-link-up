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
      scope,
      budgetRange,
      zip,
      projectType,
      contractorPool = [],
      performanceVectors = [],
      availability = [],
      workload = []
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

    console.log("Orchestrating marketplace routing for project:", projectId);

    // Build comprehensive AI prompt
    const prompt = `You are SmartReno's Global Marketplace Orchestrator.

Analyze this project and rank contractors based on:
- Performance scores
- Availability
- Specialty match
- Warranty history
- Bid speed
- Pro+ subscriptions
- Location optimization

Project Details:
- ID: ${projectId}
- Type: ${projectType}
- Budget: ${budgetRange}
- Zip: ${zip}
- Scope: ${JSON.stringify(scope)}

Contractor Pool: ${contractorPool.length} contractors
Performance Data: ${JSON.stringify(performanceVectors)}
Availability: ${JSON.stringify(availability)}
Workload: ${JSON.stringify(workload)}

Return JSON:
{
  "ranked_contractors": [
    {"contractorId": "C1", "score": 94, "reason": "Strong in kitchens + fast bids"},
    {"contractorId": "C7", "score": 89, "reason": "Great for Bergen County projects"}
  ],
  "auto_routing_decision": true,
  "selected_contractors": ["C1", "C7", "C3"]
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
    
    let orchestratorResult;
    try {
      orchestratorResult = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        orchestratorResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Orchestrator result:', orchestratorResult);

    // Log routing decision
    const { error: logError } = await supabase
      .from('marketplace_routing_logs')
      .insert({
        project_id: projectId,
        ranked_contractors: orchestratorResult.ranked_contractors,
        selected_contractors: orchestratorResult.selected_contractors,
        orchestrator_decision: orchestratorResult,
        routing_reason: 'AI orchestrator automatic routing',
        auto_routing_enabled: true
      });

    if (logError) {
      console.error('Error logging routing:', logError);
    }

    // Log to AI Hub
    await supabase.from('ai_agent_activity').insert({
      agent_type: 'marketplace_orchestrator',
      user_id: user.id,
      user_role: 'admin',
      project_id: projectId,
      status: 'completed',
      input: { projectId, contractorPool, budgetRange },
      output: orchestratorResult
    });

    return new Response(
      JSON.stringify(orchestratorResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-marketplace-orchestrator:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

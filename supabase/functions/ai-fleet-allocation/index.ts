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
      crews = [],
      projectTimelines = [],
      skillSets = [],
      delayRisks = []
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

    console.log("Allocating fleet for Enterprise contractor:", contractorId);

    // Build AI prompt
    const prompt = `You are an Enterprise fleet allocation AI for multi-crew contractors.

Optimize crew allocation across projects:

Contractor ID: ${contractorId}
Available Crews: ${JSON.stringify(crews)}
Project Timelines: ${JSON.stringify(projectTimelines)}
Skill Sets: ${JSON.stringify(skillSets)}
Delay Risks: ${JSON.stringify(delayRisks)}

Provide optimal allocation plan in JSON:
{
  "allocation_plan": [
    {
      "crewId": "C1",
      "assignedProject": "P927",
      "reason": "Tile crew available + high timeline risk",
      "start_date": "2025-02-15",
      "duration_days": 7
    }
  ],
  "efficiency_gain": "12%",
  "conflicts": [],
  "resource_utilization": "94%",
  "recommendations": ["Hire additional framing crew for peak season"]
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
    
    let allocationPlan;
    try {
      allocationPlan = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        allocationPlan = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Fleet allocation result:', allocationPlan);

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'fleet_allocation',
        user_id: user.id,
        user_role: 'contractor',
        status: 'completed',
        input: { contractorId, crewCount: crews.length, projectCount: projectTimelines.length },
        output: allocationPlan,
        subscription_level: 'enterprise'
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(allocationPlan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-fleet-allocation:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

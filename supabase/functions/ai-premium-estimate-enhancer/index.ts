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
      estimate = {},
      projectId = "",
      contractorProfile = {},
      marketData = {}
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

    console.log("Enhancing premium estimate for project:", projectId);

    // Build AI prompt
    const prompt = `You are a premium estimate enhancement AI for Pro+ contractors.

Analyze this estimate and provide premium suggestions:

Estimate: ${JSON.stringify(estimate).substring(0, 1000)}
Project ID: ${projectId}
Contractor Profile: ${JSON.stringify(contractorProfile)}
Market Data: ${JSON.stringify(marketData)}

Provide premium enhancement recommendations in JSON:
{
  "premium_suggestions": [
    "Add optional Hardie siding upgrade for $2,400",
    "HVAC should be priced +7% for winter demand"
  ],
  "margin_gain": 4.2,
  "timeline_effect": "Siding upgrade adds 3 days",
  "upsell_opportunities": ["Premium windows", "Extended warranty"],
  "pricing_optimization": "Current labor rate is 8% below market average"
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
    
    let enhancement;
    try {
      enhancement = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        enhancement = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Premium estimate enhancement result:', enhancement);

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'premium_estimate_enhancer',
        user_id: user.id,
        user_role: 'estimator',
        project_id: projectId,
        status: 'completed',
        input: { projectId, estimateId: estimate.id },
        output: enhancement,
        subscription_level: 'pro_plus'
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(enhancement),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-premium-estimate-enhancer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

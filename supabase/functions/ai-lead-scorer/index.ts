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
      homeownerProfile = {},
      scope = {},
      budget = "",
      contractorId
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

    console.log("Scoring lead:", projectId, "for contractor:", contractorId);

    // Build AI prompt
    const prompt = `You are a lead scoring expert for construction contractors.

Score this lead for the contractor:

Project ID: ${projectId}
Homeowner Profile: ${JSON.stringify(homeownerProfile)}
Project Scope: ${JSON.stringify(scope).substring(0, 500)}
Budget: ${budget}
Contractor ID: ${contractorId}

Provide a lead score (0-100) and analysis:

Return JSON:
{
  "lead_score": 88,
  "fit_reason": "Contractor specializes in kitchens; homeowner has high budget",
  "conversion_probability": 0.76,
  "recommended_pitch": "Highlight your recent kitchen projects in this area"
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
    
    let leadScore;
    try {
      leadScore = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        leadScore = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Lead score result:', leadScore);

    // Save to database
    const { error: saveError } = await supabase
      .from('lead_scores')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        lead_score: leadScore.lead_score,
        fit_reason: leadScore.fit_reason,
        conversion_probability: leadScore.conversion_probability,
        recommended_pitch: leadScore.recommended_pitch
      });

    if (saveError) {
      console.error('Error saving lead score:', saveError);
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'lead_scorer',
        user_id: user.id,
        user_role: 'contractor',
        project_id: projectId,
        status: 'completed',
        input: { projectId, contractorId, budget },
        output: leadScore,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(leadScore),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-lead-scorer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

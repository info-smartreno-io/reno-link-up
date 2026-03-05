import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      timeline = [],
      messages = [],
      contractorStats = {},
      materialDelays = [],
      walkthroughNotes = {},
      recentUploads = []
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing project risk:', projectId);

    // Build AI prompt
    const prompt = `You are an expert construction project risk analyst for a home renovation platform.

Analyze this project data and calculate risk score:

Timeline Events: ${JSON.stringify(timeline).substring(0, 500)}
Recent Messages: ${JSON.stringify(messages).substring(0, 500)}
Contractor Performance Stats: ${JSON.stringify(contractorStats)}
Material Delays: ${JSON.stringify(materialDelays)}
Walkthrough Notes: ${JSON.stringify(walkthroughNotes).substring(0, 300)}

Based on this information, assess project risk:

1. **Risk Score (0-100)**: Overall risk level
   - 0-30: Low risk (green)
   - 31-60: Medium risk (yellow)
   - 61-100: High risk (red)

2. **Risk Factors**: Key issues affecting the project

3. **Likelihood of Delay**: low, medium, high

4. **Recommended Actions**: Specific steps to mitigate risk

5. **Alert Level**: green, yellow, or red

Consider:
- Communication patterns (delays in responses)
- Contractor historical performance
- Material delivery issues
- Timeline pressure points
- Homeowner satisfaction indicators

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "risk_score": 72,
  "risk_factors": ["material delays", "slow contractor response"],
  "likelihood_of_delay": "medium",
  "recommended_actions": [
    "Request updated schedule",
    "Verify material ETA",
    "Increase PM check-ins"
  ],
  "alert_level": "yellow",
  "reasoning": "Brief explanation of the risk assessment"
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
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
    
    let riskAnalysis;
    try {
      riskAnalysis = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        riskAnalysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Risk analysis result:', riskAnalysis);

    // Save to risk_scores table
    const { error: saveError } = await supabase
      .from('risk_scores')
      .insert({
        project_id: projectId,
        risk_score: riskAnalysis.risk_score,
        risk_factors: riskAnalysis.risk_factors,
        recommended_actions: riskAnalysis.recommended_actions,
        alert_level: riskAnalysis.alert_level,
      });

    if (saveError) {
      console.error('Error saving risk score:', saveError);
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'RiskPredictionAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, timeline, messages, contractorStats },
        output: riskAnalysis,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(riskAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-risk-predictor:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

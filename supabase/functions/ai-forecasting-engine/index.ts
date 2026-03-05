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
      scope = {},
      contractorPerformance = {},
      subSchedules = [],
      materialLeadTimes = [],
      pastSimilarProjects = []
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Forecasting project:', projectId);

    // Build AI prompt
    const prompt = `You are an expert construction project forecasting analyst for a home renovation platform.

Analyze this project data and create predictions:

Project Scope: ${JSON.stringify(scope).substring(0, 500)}
Contractor Performance: ${JSON.stringify(contractorPerformance)}
Sub Schedules: ${JSON.stringify(subSchedules).substring(0, 500)}
Material Lead Times: ${JSON.stringify(materialLeadTimes)}
Similar Past Projects: ${JSON.stringify(pastSimilarProjects).substring(0, 500)}

Based on this information, forecast project outcomes:

1. **Predicted Completion Date**: Best estimate in YYYY-MM-DD format

2. **Confidence Level**: 0.0 to 1.0 (how confident are you in this prediction)

3. **Budget Variance**: Percentage above or below original budget (e.g., "+4.5%" or "-2.1%")

4. **Timeline Pressure Points**: Specific milestones or trades that may cause delays

5. **Reasoning**: Brief explanation of your forecast

Consider:
- Historical contractor performance
- Material lead time trends
- Sub-trade coordination complexity
- Seasonal factors
- Similar project outcomes

Return your forecast in this exact JSON format (no markdown, just raw JSON):
{
  "predicted_completion_date": "2025-03-14",
  "confidence": 0.86,
  "budget_variance": "+4.5%",
  "timeline_pressure_points": ["HVAC rough-in", "Tile delivery"],
  "reasoning": "Brief explanation of forecast"
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
    
    let forecast;
    try {
      forecast = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        forecast = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Forecast result:', forecast);

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'ForecastingAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, scope, contractorPerformance },
        output: forecast,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(forecast),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-forecasting-engine:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

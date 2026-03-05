import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
      homeownerId,
      projectId,
      sessionBehavior = {}
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing conversion optimization for homeowner:', homeownerId);

    // Build AI prompt
    const prompt = `You are a conversion optimization expert for a home renovation platform.

Analyze this homeowner's behavior and recommend conversion tactics:

Homeowner ID: ${homeownerId}
Project ID: ${projectId}
Session Behavior: ${JSON.stringify(sessionBehavior)}

Session data includes:
- Time on page
- Pages viewed
- Actions taken (clicked pricing, viewed FAQs, etc.)
- Hesitation indicators (abandoned forms, back-and-forth navigation)

Based on this information, provide conversion optimization recommendations:

1. **Conversion Probability**: Score from 0.0 to 1.0
2. **Recommended Steps**: Actionable tactics to increase booking rate
3. **Messaging Strategy**: What to communicate to this homeowner
4. **Friction Points**: What's preventing conversion
5. **Next Best Action**: Single most important thing to do now

Consider tactics like:
- Offering financing options
- Showing project gallery/testimonials
- Simplifying intake questions
- Time-limited promotions
- Free consultation offers
- Payment plan options
- Risk-reduction messaging (warranties, guarantees)

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "conversion_probability": 0.68,
  "recommended_steps": [
    "Offer financing calculator",
    "Show before/after gallery for similar projects",
    "Reduce intake form from 8 to 4 questions"
  ],
  "messaging_strategy": "Focus on making the project affordable and risk-free",
  "friction_points": [
    "Homeowner viewed pricing 3 times but didn't proceed",
    "Spent time on FAQ - likely has concerns"
  ],
  "next_best_action": "Send personalized message offering free consultation",
  "recommended_message": "Still thinking it over? Book a free, no-obligation consultation to discuss your project!",
  "reasoning": "Brief explanation of conversion strategy"
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
    
    let conversionAnalysis;
    try {
      conversionAnalysis = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        conversionAnalysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Conversion optimization result:', conversionAnalysis);

    // Save conversion event to database
    const { error: saveError } = await supabase
      .from('conversion_events')
      .insert({
        homeowner_id: homeownerId,
        project_id: projectId,
        session_data: sessionBehavior,
        conversion_probability: conversionAnalysis.conversion_probability,
        recommended_steps: conversionAnalysis.recommended_steps,
        ai_message: conversionAnalysis.recommended_message,
      });

    if (saveError) {
      console.error('Error saving conversion event:', saveError);
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'ConversionOptimizationAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { homeownerId, projectId, sessionBehavior },
        output: conversionAnalysis,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(conversionAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-conversion-optimizer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

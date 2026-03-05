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
      homeownerProfile = {},
      budgetRange = '',
      uploadedPhotos = []
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing upsell opportunities:', projectId);

    // Build AI prompt
    const prompt = `You are an expert upsell analyst for a home renovation platform.

Analyze this project and identify upsell opportunities:

Project Scope: ${JSON.stringify(scope).substring(0, 500)}
Homeowner Profile: ${JSON.stringify(homeownerProfile)}
Budget Range: ${budgetRange}
Uploaded Photos Count: ${uploadedPhotos.length}

Based on this information, identify upsell opportunities:

1. **Upsell Opportunities**: List of revenue-increasing services
   Each should include:
   - title: Service name
   - estimated_increase: Dollar amount
   - reason: Why this makes sense for this project
   - recommended_language: Suggested wording to present to homeowner

Consider upsells like:
- 3D design packages
- Architectural drawings
- Premium material upgrades (Marvin windows, Hardie siding, engineered hardwood)
- Additional rooms or spaces
- High-efficiency HVAC systems
- Smart home integration
- Extended warranties
- Professional staging/design consultation

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "upsell_opportunities": [
    {
      "title": "3D Design Package",
      "estimated_increase": 350,
      "reason": "Homeowner uploaded inspiration images indicating design interest",
      "recommended_language": "Would you like a 3D rendering to visualize your new kitchen before construction begins?"
    }
  ],
  "total_potential_increase": 1200,
  "confidence": 0.85,
  "reasoning": "Brief explanation of upsell strategy"
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
    
    let upsellAnalysis;
    try {
      upsellAnalysis = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        upsellAnalysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Upsell analysis result:', upsellAnalysis);

    // Save upsell opportunities to database
    if (upsellAnalysis.upsell_opportunities && upsellAnalysis.upsell_opportunities.length > 0) {
      const upsellInserts = upsellAnalysis.upsell_opportunities.map((opp: any) => ({
        project_id: projectId,
        upsell_title: opp.title,
        estimated_increase: opp.estimated_increase,
        ai_reason: opp.reason,
      }));

      const { error: saveError } = await supabase
        .from('upsell_events')
        .insert(upsellInserts);

      if (saveError) {
        console.error('Error saving upsell events:', saveError);
      }
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'UpsellAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, scope, budgetRange },
        output: upsellAnalysis,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(upsellAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-upsell-engine:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

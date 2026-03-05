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
      budget = '',
      projectType = '',
      homeownerProfile = {},
      location = ''
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating financing recommendations for project:', projectId);

    // Build AI prompt
    const prompt = `You are a home renovation financing expert.

Analyze this project and recommend financing options:

Budget: ${budget}
Project Type: ${projectType}
Homeowner Profile: ${JSON.stringify(homeownerProfile)}
Location: ${location}

Based on this information, recommend financing options:

1. **Recommended Options**: List of financing types with details
   Each should include:
   - type: HELOC, Construction Loan, Personal Loan, Home Equity Loan, Cash-Out Refinance, etc.
   - reason: Why this option makes sense
   - estimated_rate: Interest rate range
   - pros: Key benefits
   - cons: Potential drawbacks

2. **Best Match**: Which option is most suitable
3. **Conversion Language**: Suggested messaging to present to homeowner

Consider:
- Project scope and timeline
- Budget range
- Property type (if mentioned)
- Market interest rates
- Typical financing for this project type

Return your recommendations in this exact JSON format (no markdown, just raw JSON):
{
  "recommended_options": [
    {
      "type": "HELOC",
      "reason": "Home value is likely high and interest rates are favorable for equity-based financing",
      "estimated_rate": "7-8%",
      "pros": ["Flexible draw periods", "Tax-deductible interest"],
      "cons": ["Variable rate risk"]
    }
  ],
  "best_match": "HELOC",
  "conversion_language": "Based on your project scope, a Home Equity Line of Credit (HELOC) offers the most flexibility with competitive rates around 7-8%.",
  "reasoning": "Brief explanation of recommendation strategy"
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
    
    let financeRecommendations;
    try {
      financeRecommendations = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        financeRecommendations = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Finance recommendations result:', financeRecommendations);

    // Save finance recommendations to database
    const { error: saveError } = await supabase
      .from('finance_recommendations')
      .insert({
        project_id: projectId,
        homeowner_id: homeownerProfile.id || null,
        recommended_options: financeRecommendations.recommended_options,
      });

    if (saveError) {
      console.error('Error saving finance recommendations:', saveError);
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'FinancingRecommendationAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, budget, projectType },
        output: financeRecommendations,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(financeRecommendations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-finance-recommender:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

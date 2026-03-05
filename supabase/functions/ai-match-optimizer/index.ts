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
      budgetRange = '',
      zip = '',
      contractorPool = []
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Optimizing contractor matches for project:', projectId);

    // Build AI prompt
    const prompt = `You are an expert contractor matching analyst for a home renovation platform.

Analyze this project and rank the best contractor matches:

Project Scope: ${JSON.stringify(scope).substring(0, 500)}
Budget Range: ${budgetRange}
Zip Code: ${zip}
Available Contractors: ${JSON.stringify(contractorPool).substring(0, 1000)}

Based on this information, rank contractors by match quality:

1. **Ranked Contractors**: List contractors with scores (0-100)
   Each should include:
   - contractorId: ID
   - score: Match quality score
   - fit_reason: Why this contractor is a good/bad match
   - strengths: Key strengths for this project
   - concerns: Potential issues to watch

2. **Recommended Count**: How many contractors should bid (typically 3-5)
3. **Routing Strategy**: Brief explanation of recommendation logic

Consider:
- Contractor win rate
- Past project quality (ratings, warranty claims)
- Specialty match (kitchens, bathrooms, additions, etc.)
- Budget alignment
- Geographic proximity
- Response time history
- Availability/capacity

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "ranked_contractors": [
    {
      "contractorId": "123",
      "score": 92,
      "fit_reason": "Strong history with kitchen remodels in similar budget range",
      "strengths": ["Fast response time", "High ratings", "Low warranty claims"],
      "concerns": ["Currently has 3 active projects"]
    }
  ],
  "recommended_count": 3,
  "routing_strategy": "Top 3 contractors all score above 85 and have proven track records in kitchen remodeling",
  "reasoning": "Brief explanation of matching logic"
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
    
    let matchAnalysis;
    try {
      matchAnalysis = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        matchAnalysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Match optimization result:', matchAnalysis);

    // Save match scores to database
    if (matchAnalysis.ranked_contractors && matchAnalysis.ranked_contractors.length > 0) {
      const matchInserts = matchAnalysis.ranked_contractors.map((match: any) => ({
        project_id: projectId,
        contractor_id: match.contractorId,
        match_score: match.score,
        fit_reason: match.fit_reason,
        recommended: match.score >= 80,
      }));

      const { error: saveError } = await supabase
        .from('match_scores')
        .insert(matchInserts);

      if (saveError) {
        console.error('Error saving match scores:', saveError);
      }
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'MatchOptimizationAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, scope, budgetRange, zip },
        output: matchAnalysis,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(matchAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-match-optimizer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

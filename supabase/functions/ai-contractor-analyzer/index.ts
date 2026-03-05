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
      contractorId, 
      pastBids = [], 
      winRate = 0, 
      projectOutcomes = [], 
      warrantyClaims = [], 
      responseTimes = [], 
      ratingHistory = [], 
      trade = 'General Contractor' 
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing contractor:', contractorId);

    // Build AI prompt
    const prompt = `You are an expert contractor performance analyst for a home renovation platform.

Analyze this contractor's performance data:

**Trade**: ${trade}
**Win Rate**: ${winRate}%
**Past Bids**: ${pastBids.length} submitted
**Completed Projects**: ${projectOutcomes.length}
**Warranty Claims**: ${warrantyClaims.length}
**Average Response Time**: ${responseTimes.length > 0 ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length : 'N/A'} hours
**Average Rating**: ${ratingHistory.length > 0 ? (ratingHistory.reduce((a: number, b: number) => a + b, 0) / ratingHistory.length).toFixed(1) : 'N/A'}

Project Outcomes Summary: ${JSON.stringify(projectOutcomes).substring(0, 500)}
Warranty Claims Summary: ${JSON.stringify(warrantyClaims).substring(0, 300)}

Based on this data, provide a comprehensive performance analysis:

1. **Performance Score**: Calculate a score from 0-100 based on:
   - Win rate
   - Project completion quality
   - Response times
   - Warranty claim frequency
   - Customer ratings

2. **Strengths**: List 3-5 specific strengths with evidence

3. **Weaknesses**: List 2-4 areas needing improvement

4. **Risk Flags**: Identify any concerning patterns (delays, quality issues, warranty claims, etc.)

5. **Recommended Matches**: Suggest:
   - Project types this contractor excels at
   - Zip codes/areas to prioritize
   - Trades they should focus on
   - Project sizes (budget ranges) that fit best

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "performance_score": 85,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "risk_flags": ["Risk flag 1", "Risk flag 2"],
  "recommended_matches": {
    "project_types": ["Kitchen remodels", "Bathroom renovations"],
    "trades": ["Flooring", "Tile work"],
    "budget_ranges": ["$50k-$150k"],
    "geographic_focus": ["Area recommendations"]
  },
  "improvement_areas": ["Action item 1", "Action item 2"]
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
    
    let analysis;
    try {
      // Try to parse the content as JSON
      analysis = JSON.parse(content);
    } catch {
      // If parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Analysis result:', analysis);

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'ContractorNetworkAI',
        user_id: contractorId || '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        status: 'completed',
        input: { contractorId, trade, winRate, projectCount: projectOutcomes.length },
        output: analysis,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-contractor-analyzer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

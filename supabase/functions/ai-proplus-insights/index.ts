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
      projectHistory = [],
      bidHistory = [],
      ratings = [],
      warrantyCaseHistory = []
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

    console.log("Generating Pro+ insights for contractor:", contractorId);

    // Build AI prompt
    const prompt = `You are a contractor performance analyst.

Analyze this contractor's performance and provide actionable insights:

Contractor ID: ${contractorId}
Projects Completed: ${projectHistory.length}
Bids Submitted: ${bidHistory.length}
Average Rating: ${ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : "N/A"}
Warranty Cases: ${warrantyCaseHistory.length}

Project History Sample: ${JSON.stringify(projectHistory.slice(0, 5))}
Bid History Sample: ${JSON.stringify(bidHistory.slice(0, 5))}

Provide analysis in JSON:
{
  "summary": "Strong in bathrooms, weak in additions",
  "recommended_project_types": ["bathrooms", "kitchen remodels"],
  "average_bid_position": 2.1,
  "win_rate": 27,
  "improvement_areas": ["bid speed", "timeline communication"],
  "market_trends": ["Tile installation costs increased 12%"]
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
    
    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Pro+ insights result:', insights);

    // Save to database
    const { error: saveError } = await supabase
      .from('proplus_insights')
      .upsert({
        contractor_id: contractorId,
        summary: insights.summary,
        recommended_project_types: insights.recommended_project_types,
        average_bid_position: insights.average_bid_position,
        win_rate: insights.win_rate,
        improvement_areas: insights.improvement_areas,
        market_trends: insights.market_trends
      }, {
        onConflict: 'contractor_id'
      });

    if (saveError) {
      console.error('Error saving Pro+ insights:', saveError);
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'proplus_insights',
        user_id: user.id,
        user_role: 'contractor',
        status: 'completed',
        input: { contractorId, projectCount: projectHistory.length },
        output: insights,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-proplus-insights:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

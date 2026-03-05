import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      projectType, 
      location, 
      squareFootage, 
      materials, 
      timeline 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert renovation cost estimator for SmartReno.io. 
Analyze the project details and provide a comprehensive cost estimate with the following:
1. Total cost range (low, mid, high estimates)
2. Breakdown by category (materials, labor, permits, contingency)
3. Key cost drivers and assumptions
4. Potential cost-saving opportunities
5. Timeline impact on costs
6. Regional pricing considerations for ${location}

Be realistic and transparent about uncertainties. Output valid JSON only.`;

    const userPrompt = `Estimate costs for:
- Project Type: ${projectType}
- Location: ${location}
- Square Footage: ${squareFootage} sq ft
- Materials Quality: ${materials}
- Timeline: ${timeline}

Provide detailed cost breakdown and insights.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    // Parse JSON response
    let estimate;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      estimate = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse cost estimate');
    }

    // Log the estimate for analytics
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'cost_estimator',
      user_id: '00000000-0000-0000-0000-000000000000', // Anonymous
      user_role: 'homeowner',
      input: { projectType, location, squareFootage, materials, timeline },
      output: estimate,
      status: 'completed'
    });

    return new Response(
      JSON.stringify({ success: true, estimate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-cost-estimator:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

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
      materials = [],
      vendorData = {}
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing material lead times for project:', projectId);

    // Fetch historical lead time data
    const { data: historicalData } = await supabase
      .from('material_lead_times')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(50);

    // Build AI prompt
    const prompt = `You are an expert supply chain analyst for a construction platform.

Analyze material lead times and predict delays:

Project Materials: ${JSON.stringify(materials)}
Vendor Data: ${JSON.stringify(vendorData)}
Historical Lead Time Data: ${JSON.stringify(historicalData || []).substring(0, 1000)}

Based on this information, assess material risks:

1. **Material Risks**: List of materials with potential delays
   - material: Name of the material
   - expected_delay: Range of delay in days (e.g., "6-8 days")
   - severity: low, medium, or high
   - reason: Explanation for the delay

2. **Recommended Schedule Adjustments**: Specific timeline changes to accommodate delays

Consider:
- Historical lead time trends
- Seasonal factors (holidays, weather)
- Vendor reliability patterns
- Material complexity and customization
- Supply chain disruptions

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "material_risks": [
    {
      "material": "Anderson 400 Windows",
      "expected_delay": "6-8 days",
      "severity": "medium",
      "reason": "Historical delays + holiday season"
    }
  ],
  "recommended_schedule_adjustments": [
    "Push inspection to next Thursday",
    "Reschedule drywall to next week"
  ]
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
      analysis = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Material lead time analysis:', analysis);

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'MaterialLeadTimeAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, materials, vendorData },
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
    console.error('Error in ai-materials-leadtime-intelligence:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

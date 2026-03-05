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
    const { state, county, municipality, projectType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    console.log("Getting permit & code intelligence for:", state, municipality, projectType);

    const prompt = `Provide comprehensive permit and building code intelligence for this location.

State: ${state}
County: ${county || 'N/A'}
Municipality: ${municipality || 'N/A'}
Project Type: ${projectType}

Analyze:
- Required permits for this project type
- Local building codes
- Fire code requirements
- Climate zone considerations (hurricane, seismic, snow load, wind)
- Submission format requirements
- Processing time estimates
- Fee structure
- Special local requirements

Return JSON:
{
  "required_permits": ["Building Permit", "Electrical Permit", "Plumbing Permit"],
  "submission_format": "Electronic via BuildingDept portal",
  "processing_time_days": 14,
  "fee_structure": {
    "building_permit": "$250 base + $0.50/sqft",
    "electrical_permit": "$150"
  },
  "special_requirements": [
    "Hurricane straps required",
    "Impact-resistant windows required"
  ],
  "climate_zone": "Zone 2A",
  "seismic_zone": "Low risk",
  "wind_zone": "140mph",
  "snow_load_requirements": "N/A",
  "fire_code_version": "2021 IFC"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let permitIntel;
    try {
      permitIntel = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) permitIntel = JSON.parse(jsonMatch[1]);
      else throw new Error('Failed to parse AI response');
    }

    // Store permit rules
    await supabase.from('regional_permit_rules').upsert({
      state,
      county,
      municipality,
      project_type: projectType,
      required_permits: permitIntel.required_permits,
      submission_format: permitIntel.submission_format,
      processing_time_days: permitIntel.processing_time_days,
      fee_structure: permitIntel.fee_structure,
      special_requirements: permitIntel.special_requirements,
      climate_zone: permitIntel.climate_zone,
      seismic_zone: permitIntel.seismic_zone,
      wind_zone: permitIntel.wind_zone,
      snow_load_requirements: permitIntel.snow_load_requirements,
      fire_code_version: permitIntel.fire_code_version
    });

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'permit_code_intelligence',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { state, municipality, projectType },
      output: permitIntel
    });

    return new Response(JSON.stringify(permitIntel), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in ai-permit-code-intelligence:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

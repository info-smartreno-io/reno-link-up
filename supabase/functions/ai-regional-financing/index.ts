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
    const { state, county, zipCode } = await req.json();

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

    console.log("Finding regional financing options for:", state, county);

    const prompt = `Find the best financing options for home renovations in this location.

State: ${state}
County: ${county || 'N/A'}
ZIP Code: ${zipCode || 'N/A'}

Identify:
- HELOC programs from local banks
- Renovation loans (FHA 203k, Fannie Mae HomeStyle)
- State incentive programs
- Energy efficiency rebates
- Property tax credits
- First-time homebuyer programs
- Local credit unions
- Special financing for historic homes

Return JSON with financing options:
{
  "financing_options": [
    {
      "financing_type": "HELOC",
      "provider_name": "Local Bank",
      "min_amount": 10000,
      "max_amount": 250000,
      "interest_rate_range": "6.5% - 9.5%",
      "program_details": {
        "draw_period": "10 years",
        "repayment_period": "20 years"
      },
      "eligibility_requirements": [
        "Minimum 20% equity",
        "Credit score 680+"
      ]
    },
    {
      "financing_type": "Energy Efficiency Rebate",
      "provider_name": "State Energy Program",
      "min_amount": 0,
      "max_amount": 5000,
      "program_details": {
        "rebate_percent": "25% of cost",
        "max_rebate": "$5,000"
      },
      "eligibility_requirements": [
        "ENERGY STAR certified equipment",
        "Professional installation"
      ]
    }
  ],
  "state_incentives": [
    "Solar tax credit up to $2,500",
    "Historic home preservation grant"
  ],
  "recommendations": "HELOC best for large projects, combine with energy rebates for max savings"
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
    
    let financingOptions;
    try {
      financingOptions = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) financingOptions = JSON.parse(jsonMatch[1]);
      else throw new Error('Failed to parse AI response');
    }

    // Store financing options
    for (const option of financingOptions.financing_options || []) {
      await supabase.from('regional_financing_options').insert({
        state,
        county,
        financing_type: option.financing_type,
        provider_name: option.provider_name,
        min_amount: option.min_amount,
        max_amount: option.max_amount,
        interest_rate_range: option.interest_rate_range,
        program_details: option.program_details,
        eligibility_requirements: option.eligibility_requirements,
        state_incentives: financingOptions.state_incentives
      });
    }

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'regional_financing',
      user_id: user.id,
      user_role: 'admin',
      status: 'completed',
      input: { state, county, zipCode },
      output: financingOptions
    });

    return new Response(JSON.stringify(financingOptions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in ai-regional-financing:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

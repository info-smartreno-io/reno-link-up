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
    const { projectId, scope, notes, address, zip } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a construction estimating expert. Generate draft line items for estimates.

Guidelines:
- Create detailed line items with quantities, units, and categories
- Break down work by trade (demo, framing, electrical, plumbing, finishes)
- Suggest standard disclaimers
- Flag potential missing items
- Use photos to estimate quantities when available
- NEVER set final prices - only suggest categories and quantities
- All output is DRAFT and requires human review

Categories: demolition, framing, electrical, plumbing, hvac, insulation, drywall, flooring, painting, fixtures, cabinetry, countertops, appliances, permits`;

    const userPrompt = `Project Details:
- Address: ${address}
- ZIP: ${zip}
- Scope: ${JSON.stringify(scope)}
- Notes: ${notes}

Generate a draft estimate with:
1. lineItems: array of {description, quantity, unit, category, materialCategory, laborCategory, notes}
2. disclaimers: array of standard SmartReno disclaimers
3. missingItems: array of items that may be missing from scope
4. quantityHints: array of {item, suggestedQty, reasoning}

Return JSON only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const result = JSON.parse(aiResponse.choices[0].message.content);

    // Log AI activity
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase
          .from('ai_agent_activity')
          .insert({
            agent_type: 'smart_estimate',
            user_id: user.id,
            user_role: 'estimator',
            project_id: projectId,
            input: {
              scopeLength: JSON.stringify(scope).length,
              notesLength: notes?.length || 0,
              zip
            },
            output: {
              itemsGenerated: result.lineItems?.length || 0,
              disclaimers: result.disclaimers?.length || 0,
              missingItems: result.missingItems?.length || 0
            },
            status: 'completed'
          });
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-estimate-generator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

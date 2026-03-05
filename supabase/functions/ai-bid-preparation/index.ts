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
    const { projectId, scope, estimateDraft, photos, contractorNotes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a construction bid preparation expert helping contractors create professional, competitive bids.

Guidelines:
- Generate clean, organized bid line items based on the estimator's scope
- Suggest realistic quantities and units
- Identify potential missing items or risk areas
- Provide alternative material/approach suggestions when appropriate
- Focus on completeness and clarity
- All output is DRAFT - contractor must review and finalize

Categories: demolition, site prep, framing, electrical, plumbing, hvac, insulation, drywall, flooring, painting, fixtures, cabinetry, countertops, appliances, cleanup`;

    const userPrompt = `Project Scope:
${JSON.stringify(scope)}

${estimateDraft ? `Estimate Draft: ${JSON.stringify(estimateDraft)}` : ''}
${contractorNotes ? `Contractor Notes: ${contractorNotes}` : ''}
${photos && photos.length > 0 ? `Photos Available: ${photos.length}` : ''}

Generate a bid preparation package with:
1. draft_items: array of {description, suggestedQty, suggestedUnit, category, notes, isAddon (boolean)}
2. missing_items: array of potential gaps or risks to address
3. recommendations: array of alternative approaches or cost-saving suggestions

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
            agent_type: 'bid_preparation',
            user_id: user.id,
            user_role: 'contractor',
            project_id: projectId,
            input: {
              scopeLength: JSON.stringify(scope).length,
              hasPhotos: photos && photos.length > 0,
              hasNotes: !!contractorNotes
            },
            output: {
              itemsGenerated: result.draft_items?.length || 0,
              missingItems: result.missing_items?.length || 0,
              recommendations: result.recommendations?.length || 0
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
    console.error('Error in ai-bid-preparation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

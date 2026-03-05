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
    const { notes, photos, measurements, projectId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!notes || notes.trim().length < 10) {
      throw new Error("Notes are required (at least 10 characters)");
    }

    // Build system prompt for walkthrough organization
    const systemPrompt = `You are a construction walkthrough analyst. Your job is to organize estimator notes and photos into structured scope of work.

Extract and organize:
1. Room-by-room breakdown (Kitchen, Bathroom, Living Room, etc.)
2. Work items per room (demolition, framing, electrical, plumbing, finishes)
3. Red flags or concerns (structural issues, code violations, water damage)
4. Material categories needed (not brands - just categories like "flooring", "cabinetry", "fixtures")
5. Measurements or quantities mentioned

Be practical and construction-focused.`;

    const userPrompt = `Organize this walkthrough:

Notes:
${notes}

${measurements ? `Measurements: ${JSON.stringify(measurements)}` : ''}
${photos && photos.length > 0 ? `Number of photos: ${photos.length}` : 'No photos'}

Return a JSON object with:
- rooms: Array of {name, scopeItems: string[]}
- redFlags: string[]
- materialCategories: string[]
- summary: string (2-3 sentences)`;

    // Call Lovable AI
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

    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'walkthrough',
        user_id: user?.id || 'system',
        user_role: 'estimator',
        project_id: projectId,
        input: {
          notesLength: notes.length,
          photoCount: photos?.length || 0,
          hasMeasurements: !!measurements
        },
        output: result,
        status: 'completed'
      });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-walkthrough-organizer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

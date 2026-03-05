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
    const { description, photos, projectId, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build system prompt for intake analysis
    const systemPrompt = `You are a construction project intake analyst. Your job is to analyze homeowner descriptions and extract structured project information.

Extract and suggest:
1. Project type (kitchen_remodel, bathroom_remodel, addition, etc.)
2. Rooms affected (list of rooms)
3. Estimated square footage (if mentioned or can be inferred)
4. Structured scope bullets
5. Whether mechanical/electrical/plumbing work is needed
6. Any recommendations or clarifying questions

Be helpful and practical. If information is missing, make reasonable suggestions based on typical projects.`;

    const userPrompt = `Analyze this project description:

${description}

${photos && photos.length > 0 ? `Number of photos provided: ${photos.length}` : 'No photos provided'}

Return a JSON object with: projectType, rooms, squareFootage, scope (array of bullets), needsMechanical, needsElectrical, needsPlumbing, recommendations (array of strings)`;

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

    // If projectId provided, optionally update the project record
    if (projectId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('projects')
        .update({
          project_type: result.projectType,
          scope_of_work: result.scope.join('\n'),
          square_footage: result.squareFootage,
          ai_suggested_data: result
        })
        .eq('id', projectId);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-smart-intake:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

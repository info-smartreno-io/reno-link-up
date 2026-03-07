import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { section_key, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sectionPrompts: Record<string, string> = {
      project_overview: "Generate a professional project overview for a renovation design package. Include project scope, goals, timeline expectations, and key stakeholders.",
      homeowner_vision: "Generate a homeowner vision summary. Capture their aesthetic preferences, functional goals, inspiration references, lifestyle needs, and priorities.",
      existing_conditions: "Generate an existing conditions assessment. Cover current layout, structural observations, mechanical systems, code concerns, and measurement notes.",
      design_direction: "Generate a design direction document. Include style direction, material palette suggestions, spatial planning concepts, and key design decisions.",
      permit_technical: "Generate a permit and technical needs summary. Cover required permits, code compliance items, structural considerations, and engineering coordination.",
      renderings: "Generate a rendering plan summary. List which views and spaces should be rendered, preferred rendering style, and key features to highlight.",
      selections: "Generate a selections and finishes document. Include recommended materials, fixtures, finishes, appliances, and hardware with budget considerations.",
      contractor_handoff: "Generate a contractor handoff document. Include scope summary, special instructions, coordination notes, timeline expectations, and key contacts.",
    };

    const systemPrompt = `You are a professional design package writer for SmartReno, a home renovation platform. 
You create clear, actionable, professional design package documents that help bridge homeowner vision with contractor execution.
Write in a professional but accessible tone. Be specific and actionable. Use bullet points and clear section headers.
Output should be in markdown format.`;

    const userPrompt = `${sectionPrompts[section_key] || "Generate content for this design package section."}

Context information:
${JSON.stringify(context || {}, null, 2)}

Generate a comprehensive draft for this section. This will be reviewed and edited by the design professional before finalization.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-design-package error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

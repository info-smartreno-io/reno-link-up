import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { home_profile_id } = await req.json();
    if (!home_profile_id) {
      return new Response(JSON.stringify({ error: "home_profile_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("home_profiles").select("*").eq("id", home_profile_id).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch systems
    const { data: systems } = await supabase
      .from("home_systems").select("*").eq("home_profile_id", home_profile_id);

    // Fetch documents with extracted text
    const { data: documents } = await supabase
      .from("home_documents").select("document_type, file_name, extracted_text")
      .eq("home_profile_id", home_profile_id).not("extracted_text", "is", null);

    const currentYear = new Date().getFullYear();

    const prompt = `You are generating homeowner-facing property maintenance insights for SmartReno.

You must be conservative, practical, and non-alarmist.
Do not diagnose structural, mechanical, electrical, plumbing, roofing, or safety issues with certainty.
Use the homeowner's input, known installation dates, and general lifespan benchmarks to generate informational guidance only.

Property info:
- Address: ${profile.property_address}
- Year built: ${profile.year_built || "unknown"}
- Square footage: ${profile.square_footage || "unknown"}
- Home type: ${profile.home_type || "unknown"}
- Heating: ${profile.heat_fuel_type || "unknown"}

Systems tracked:
${(systems || []).map(s => `- ${s.system_type}: installed ${s.install_year || "unknown"}, condition: ${s.condition_rating || "unknown"}, notes: ${s.homeowner_notes || "none"}`).join("\n")}

${documents?.length ? `Documents on file: ${documents.map(d => d.document_type).join(", ")}` : "No documents uploaded."}

Current year: ${currentYear}

For each system, provide:
1. estimated age if possible
2. typical lifespan range
3. risk level: low, medium, high, or unknown
4. confidence: high, medium, or low
5. short homeowner-friendly summary
6. recommended next step
7. what missing info would improve confidence

Also provide 1-3 general home insights.

Always include language that recommendations are informational only.`;

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You analyze home systems and provide maintenance insights. Return structured JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_home_insights",
            description: "Return structured home maintenance insights",
            parameters: {
              type: "object",
              properties: {
                systems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      system_type: { type: "string" },
                      estimated_age_years: { type: "number" },
                      typical_lifespan_range: { type: "string" },
                      risk_level: { type: "string", enum: ["low", "medium", "high", "unknown"] },
                      confidence: { type: "string", enum: ["low", "medium", "high"] },
                      summary: { type: "string" },
                      recommended_action: { type: "string" },
                      missing_information: { type: "array", items: { type: "string" } },
                    },
                    required: ["system_type", "risk_level", "confidence", "summary", "recommended_action"],
                  },
                },
                general_insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      summary: { type: "string" },
                      recommendation: { type: "string" },
                      risk_level: { type: "string", enum: ["low", "medium", "high", "unknown"] },
                      confidence_level: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["title", "summary", "risk_level", "confidence_level"],
                  },
                },
              },
              required: ["systems", "general_insights"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_home_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + aiResponse.status);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const insights = JSON.parse(toolCall.function.arguments);

    // Update systems with AI data
    for (const sysInsight of insights.systems || []) {
      const matchingSystem = (systems || []).find(s => s.system_type === sysInsight.system_type);
      if (matchingSystem) {
        await supabase.from("home_systems").update({
          ai_risk_level: sysInsight.risk_level,
          ai_confidence: sysInsight.confidence,
          ai_recommendation: sysInsight.recommended_action,
          ai_reasoning_summary: sysInsight.summary,
          ai_typical_lifespan: sysInsight.typical_lifespan_range || null,
          ai_estimated_replacement_window: sysInsight.estimated_age_years
            ? `${currentYear + Math.max(0, 15 - sysInsight.estimated_age_years)}-${currentYear + Math.max(0, 20 - sysInsight.estimated_age_years)}`
            : null,
          updated_at: new Date().toISOString(),
        }).eq("id", matchingSystem.id);
      }

      // Upsert system insight
      await supabase.from("home_ai_insights").insert({
        home_profile_id,
        related_system_id: (systems || []).find(s => s.system_type === sysInsight.system_type)?.id || null,
        insight_type: "system_assessment",
        title: `${sysInsight.system_type.replace(/_/g, " ")} Assessment`,
        summary: sysInsight.summary,
        recommendation: sysInsight.recommended_action,
        risk_level: sysInsight.risk_level,
        confidence_level: sysInsight.confidence,
        supporting_factors: sysInsight.missing_information ? JSON.stringify(sysInsight.missing_information) : "[]",
        status: "active",
      });
    }

    // Insert general insights
    for (const gi of insights.general_insights || []) {
      await supabase.from("home_ai_insights").insert({
        home_profile_id,
        insight_type: "general",
        title: gi.title,
        summary: gi.summary,
        recommendation: gi.recommendation || null,
        risk_level: gi.risk_level,
        confidence_level: gi.confidence_level,
        status: "active",
      });
    }

    // Update profile
    await supabase.from("home_profiles").update({
      ai_last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", home_profile_id);

    return new Response(JSON.stringify({
      success: true,
      systems_analyzed: insights.systems?.length || 0,
      general_insights: insights.general_insights?.length || 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Generate home insights error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

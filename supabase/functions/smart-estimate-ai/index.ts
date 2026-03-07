import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SECTION_PROMPTS: Record<string, string> = {
  project_overview: "Generate a concise project overview including project type, homeowner goals, budget expectations, and timeline. Focus on renovation scope and key priorities.",
  existing_conditions: "Describe existing site conditions including current layout, structural concerns, utility constraints, access limitations, and demolition scope.",
  room_scope: "Generate a room-by-room renovation scope breakdown. For each room, describe what work is needed, materials, and special considerations.",
  trade_scope: "Generate a trade-by-trade estimate structure listing each trade category, scope items, quantities, and complexity notes.",
  materials_allowances: "Generate material and finish allowance recommendations for this project type, including flooring, tile, fixtures, appliances, cabinets, and countertops.",
  budget_guidance: "Generate internal budget guidance including estimated cost ranges, cost drivers, contingency recommendations, and risk flags. This is for SmartReno internal use only.",
  missing_info: "Generate a checklist of missing information that needs to be gathered before this estimate can be finalized. Include missing measurements, unclear selections, permit questions, etc.",
  contractor_estimate_basis: "Generate a structured summary that will form the basis for contractor pricing. Include scope, quantities, allowances, and key assumptions.",
  site_logistics: "Describe site logistics including occupied home status, parking, staging areas, delivery access, work hour constraints, and protection needs.",
  permit_technical: "Describe permit and technical requirements including permits needed, structural review, architect plans, engineering coordination, and inspection considerations.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { estimateId, sectionKey, action } = await req.json();
    if (!estimateId) throw new Error("estimateId required");

    // Fetch estimate + lead data
    const { data: estimate } = await supabase
      .from("smart_estimates")
      .select("*, leads(name, project_type, location, email, phone, client_notes, square_footage)")
      .eq("id", estimateId)
      .single();

    if (!estimate) throw new Error("Estimate not found");

    // Fetch existing sections
    const { data: sections } = await supabase
      .from("smart_estimate_sections")
      .select("section_key, section_data, is_complete")
      .eq("smart_estimate_id", estimateId);

    // Fetch rooms
    const { data: rooms } = await supabase
      .from("smart_estimate_rooms")
      .select("*")
      .eq("smart_estimate_id", estimateId);

    // Build context
    const lead = estimate.leads;
    const contextParts = [
      `Project Type: ${lead?.project_type || "Unknown"}`,
      `Client: ${lead?.name || "Unknown"}`,
      `Location: ${lead?.location || "NJ"}`,
      lead?.client_notes ? `Client Notes: ${lead.client_notes}` : "",
      lead?.client_notes ? `Additional Notes: ${lead.client_notes}` : "",
      lead?.square_footage ? `Square Footage: ${lead.square_footage}` : "",
      rooms && rooms.length > 0 ? `Rooms: ${rooms.map((r: any) => r.room_name).join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const existingSectionsSummary = sections
      ?.filter((s: any) => s.section_data?.content)
      .map((s: any) => `${s.section_key}: ${(s.section_data as any).content?.substring(0, 200)}`)
      .join("\n") || "";

    const sectionPrompt = SECTION_PROMPTS[sectionKey] || "Generate relevant content for this estimate section.";

    const systemPrompt = `You are SmartReno's estimating AI assistant. You help create structured renovation estimates for residential projects in New Jersey. Be specific, actionable, and use industry-standard terminology. Output clean, well-organized text suitable for an estimating workspace. Do NOT include pricing or dollar amounts - focus on scope, quantities, and descriptions.`;

    const userPrompt = `${sectionPrompt}\n\nProject Context:\n${contextParts}\n\n${existingSectionsSummary ? `Existing estimate data:\n${existingSectionsSummary}` : ""}`;

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
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Log activity
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("smart_estimate_activity_log").insert({
      smart_estimate_id: estimateId,
      actor_id: user?.id,
      actor_role: "system",
      action_type: "ai_generated",
      action_details: { section_key: sectionKey, action },
    });

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Smart estimate AI error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

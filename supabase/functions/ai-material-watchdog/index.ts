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
    const { projectId, materials, shipments, leadTimes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const prompt = `You are SmartReno's Material ETA Watchdog AI. Monitor material delivery delays in real-time.

PROJECT ID: ${projectId}

MATERIALS:
${JSON.stringify(materials, null, 2)}

SHIPMENTS:
${JSON.stringify(shipments, null, 2)}

LEAD TIMES:
${JSON.stringify(leadTimes, null, 2)}

Analyze and provide:
1. Delayed materials
2. Delay duration
3. Recommended timeline adjustments
4. Task re-sequencing suggestions
5. Communication messages

Provide a JSON response with:
{
  "delayed_materials": [
    {
      "material": "Material name",
      "delay": "X days",
      "impact": "Impact description"
    }
  ],
  "recommended_actions": ["Action1", "Action2"],
  "timeline_adjustment": "+X days",
  "homeowner_message": "Professional explanation",
  "critical_path_impact": "yes|no"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a construction material logistics AI. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let result = data.choices[0].message.content;

    if (result.startsWith("```json")) {
      result = result.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    const watchdogResult = JSON.parse(result);

    // Store delayed materials in material_eta_logs
    for (const material of watchdogResult.delayed_materials || []) {
      await supabase.from("material_eta_logs").insert({
        project_id: projectId,
        material_name: material.material,
        delay_days: parseInt(material.delay.match(/\d+/)?.[0] || '0'),
        recommended_actions: watchdogResult.recommended_actions
      });
    }

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "material_watchdog",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId },
      output: watchdogResult,
      status: "completed"
    });

    console.log("Material watchdog analysis completed for project:", projectId);

    return new Response(
      JSON.stringify(watchdogResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-material-watchdog:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
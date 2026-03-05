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
    const { projectId, scope, timeline, recentWork, inspectionHistory } = await req.json();

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

    const prompt = `You are SmartReno's Inspection Intelligence AI. Manage the entire inspection workflow.

PROJECT ID: ${projectId}

SCOPE:
${JSON.stringify(scope, null, 2)}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

RECENT WORK:
${JSON.stringify(recentWork, null, 2)}

INSPECTION HISTORY:
${JSON.stringify(inspectionHistory, null, 2)}

Analyze and provide:
1. Next required inspection
2. Optimal scheduling recommendation
3. Risk assessment
4. Expected outcome prediction
5. Suggested next steps

Provide a JSON response with:
{
  "next_required_inspection": "Inspection type",
  "schedule_recommendation": "Best time/day",
  "risk": "low|medium|high",
  "expected_outcome": "pass|fail|conditional",
  "preparation_checklist": ["item1", "item2"],
  "timeline_impact": "Impact description"
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
          { role: "system", content: "You are a construction inspection AI. Always respond with valid JSON." },
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

    const inspectionResult = JSON.parse(result);

    // Store in inspection_scheduler
    await supabase.from("inspection_scheduler").insert({
      project_id: projectId,
      inspection_type: inspectionResult.next_required_inspection,
      predicted_outcome: inspectionResult.expected_outcome,
      risk_level: inspectionResult.risk,
      ai_recommendation: inspectionResult.schedule_recommendation
    });

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "inspection_intelligence",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId },
      output: inspectionResult,
      status: "completed"
    });

    console.log("Inspection intelligence analysis completed for project:", projectId);

    return new Response(
      JSON.stringify(inspectionResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-inspection-intelligence:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
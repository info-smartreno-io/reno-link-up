import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, estimate, bids, timeline, messages } = await req.json();

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

    const prompt = `You are SmartReno's Autonomous QA Monitor AI. Review estimates, bids, timelines, and messages for quality issues.

PROJECT ID: ${projectId}

ESTIMATE:
${JSON.stringify(estimate, null, 2)}

BIDS:
${JSON.stringify(bids, null, 2)}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

MESSAGES:
${JSON.stringify(messages, null, 2)}

Check for:
- Missing rooms
- Missing materials
- Missing disclaimers
- Pricing outliers
- Timeline conflicts
- Inconsistent messaging
- Budget mismatches
- Incomplete scope

Provide a JSON response with:
{
  "qa_issues": ["Issue1", "Issue2"],
  "proposed_fixes": ["Fix1", "Fix2"],
  "severity_levels": ["high", "medium", "low"],
  "requires_human_review": true/false,
  "confidence_score": 0.95,
  "recommendations": ["Rec1", "Rec2"]
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
          { role: "system", content: "You are a construction QA automation AI. Always respond with valid JSON. Be thorough." },
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

    const qaResult = JSON.parse(result);

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "auto_qa_monitor",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId },
      output: qaResult,
      status: "completed",
      autonomous_decision: true,
      approval_status: qaResult.requires_human_review ? "requires_approval" : "auto_approved"
    });

    console.log("Autonomous QA monitoring completed for project:", projectId);

    return new Response(
      JSON.stringify(qaResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-auto-qa-monitor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
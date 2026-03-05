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
    const {
      projectId,
      timeline,
      messages,
      bids,
      materials,
      inspections,
      payments,
      subs,
      contractor,
      pm,
      recentActivity
    } = await req.json();

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

    const prompt = `You are SmartReno's Autonomous Operations Master AI. Analyze this project and determine what autonomous actions should be taken.

PROJECT ID: ${projectId}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

RECENT MESSAGES:
${JSON.stringify(messages, null, 2)}

BIDS:
${JSON.stringify(bids, null, 2)}

MATERIALS:
${JSON.stringify(materials, null, 2)}

INSPECTIONS:
${JSON.stringify(inspections, null, 2)}

PAYMENTS:
${JSON.stringify(payments, null, 2)}

SUBS:
${JSON.stringify(subs, null, 2)}

CONTRACTOR:
${JSON.stringify(contractor, null, 2)}

PM:
${JSON.stringify(pm, null, 2)}

RECENT ACTIVITY:
${JSON.stringify(recentActivity, null, 2)}

Provide a JSON response with:
{
  "operations_summary": "Summary of current state",
  "auto_actions": ["Action 1", "Action 2"],
  "risks_detected": ["Risk 1", "Risk 2"],
  "tasks_to_run": ["Task 1", "Task 2"],
  "requires_approval": true/false,
  "priority_level": "low|medium|high",
  "recommended_next_steps": ["Step 1", "Step 2"]
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
          { role: "system", content: "You are an autonomous construction operations AI. Always respond with valid JSON." },
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

    const operationsResult = JSON.parse(result);

    // Log to operations_run_logs
    await supabase.from("operations_run_logs").insert({
      project_id: projectId,
      run_type: "autonomous_engine",
      auto_actions: operationsResult.auto_actions,
      risks_detected: operationsResult.risks_detected,
      tasks_completed: operationsResult.tasks_to_run?.length || 0,
      requires_approval: operationsResult.requires_approval
    });

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "autonomous_operations_engine",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId },
      output: operationsResult,
      status: "completed",
      automation_level: "high",
      autonomous_decision: true,
      approval_status: operationsResult.requires_approval ? "pending" : "auto_approved"
    });

    console.log("Autonomous operations analysis completed for project:", projectId);

    return new Response(
      JSON.stringify(operationsResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-autonomous-operations-engine:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
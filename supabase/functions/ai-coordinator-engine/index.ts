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
      contractorUpdates,
      subSchedules,
      materialStatus,
      recentPhotos,
      last24hActivity
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

    const prompt = `You are SmartReno's AI Autonomous Coordinator. Analyze this project data and produce a comprehensive daily coordination report.

PROJECT ID: ${projectId}

TIMELINE DATA:
${JSON.stringify(timeline, null, 2)}

MESSAGES (LAST 24H):
${JSON.stringify(messages, null, 2)}

CONTRACTOR UPDATES:
${JSON.stringify(contractorUpdates, null, 2)}

SUBCONTRACTOR SCHEDULES:
${JSON.stringify(subSchedules, null, 2)}

MATERIAL STATUS:
${JSON.stringify(materialStatus, null, 2)}

RECENT PHOTOS:
${recentPhotos?.length || 0} photos uploaded

RECENT ACTIVITY:
${JSON.stringify(last24hActivity, null, 2)}

Provide a JSON response with:
{
  "status_summary": "Brief overall project status",
  "risks_detected": ["risk1", "risk2"],
  "recommended_actions": ["action1", "action2"],
  "auto_drafts": {
    "homeowner_message": "Draft message to homeowner",
    "contractor_message": "Draft message to contractor"
  },
  "priority_level": "low|medium|high"
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
          { role: "system", content: "You are a construction project coordinator AI. Always respond with valid JSON." },
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

    const coordinatorReport = JSON.parse(result);

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "coordinator_engine",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        timeline,
        messages,
        contractorUpdates,
        subSchedules,
        materialStatus,
        last24hActivity
      },
      output: coordinatorReport,
      status: "completed"
    });

    // Store coordinator report
    await supabase.from("coordinator_reports").insert({
      project_id: projectId,
      report: coordinatorReport
    });

    console.log("Coordinator report generated for project:", projectId);

    return new Response(
      JSON.stringify(coordinatorReport),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-coordinator-engine:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

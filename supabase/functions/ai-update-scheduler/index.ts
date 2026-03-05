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
      recentChanges,
      milestones,
      delays
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

    const prompt = `You are SmartReno's AI Homeowner Update Scheduler. Draft a professional, reassuring weekly update for the homeowner.

PROJECT ID: ${projectId}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

RECENT CHANGES:
${JSON.stringify(recentChanges, null, 2)}

MILESTONES:
${JSON.stringify(milestones, null, 2)}

DELAYS:
${JSON.stringify(delays, null, 2)}

Provide a JSON response with:
{
  "scheduled_update": {
    "send_on": "YYYY-MM-DD",
    "message": "Professional homeowner update message"
  },
  "urgency_level": "low|medium|high"
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
          { role: "system", content: "You are a construction project communication AI. Always respond with valid JSON. Be professional, clear, and reassuring." },
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

    const updateSchedule = JSON.parse(result);

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "update_scheduler",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        timeline,
        recentChanges,
        milestones,
        delays
      },
      output: updateSchedule,
      status: "completed"
    });

    console.log("Homeowner update scheduled for project:", projectId);

    return new Response(
      JSON.stringify(updateSchedule),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-update-scheduler:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

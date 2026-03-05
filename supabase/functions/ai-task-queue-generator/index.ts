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
      recentEvents,
      riskFactors,
      materials,
      pendingItems
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

    const prompt = `You are SmartReno's AI Task Queue Generator. Create a prioritized daily task list for the project coordinator.

PROJECT ID: ${projectId}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

RECENT EVENTS:
${JSON.stringify(recentEvents, null, 2)}

RISK FACTORS:
${JSON.stringify(riskFactors, null, 2)}

MATERIALS:
${JSON.stringify(materials, null, 2)}

PENDING ITEMS:
${JSON.stringify(pendingItems, null, 2)}

Provide a JSON response with:
{
  "task_list": [
    {
      "task": "Description",
      "priority": "high|medium|low",
      "reason": "Why this task matters",
      "deadline": "YYYY-MM-DD or 'today'"
    }
  ],
  "summary": "Overall task queue summary"
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
          { role: "system", content: "You are a construction task prioritization AI. Always respond with valid JSON." },
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

    const taskQueue = JSON.parse(result);

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "task_queue_generator",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        timeline,
        recentEvents,
        riskFactors,
        materials,
        pendingItems
      },
      output: taskQueue,
      status: "completed"
    });

    // Store in task_queue table
    if (taskQueue.task_list && taskQueue.task_list.length > 0) {
      await supabase.from("task_queue").insert({
        project_id: projectId,
        task_list: taskQueue.task_list,
        priority_levels: taskQueue.task_list.map((t: any) => t.priority),
        assigned_to: user.id,
        status: "pending"
      });
    }

    console.log("Task queue generated for project:", projectId);

    return new Response(
      JSON.stringify(taskQueue),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-task-queue-generator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

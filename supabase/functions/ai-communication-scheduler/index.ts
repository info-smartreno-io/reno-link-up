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
    const { projectId, event, recipient, context } = await req.json();

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

    const prompt = `You are SmartReno's AI Communication Scheduler. Draft and schedule communications across all portals.

PROJECT ID: ${projectId}
EVENT: ${event}
RECIPIENT: ${recipient}
CONTEXT:
${JSON.stringify(context, null, 2)}

Draft a professional, context-aware message with:
- Appropriate tone matching
- Style guidelines
- Project context
- Risk sensitivity
- Homeowner frustration detection (if applicable)

Provide a JSON response with:
{
  "scheduled_time": "ISO timestamp",
  "message": "The drafted message",
  "importance": "low|medium|high",
  "follow_up": "Description of follow-up action",
  "tone": "professional|reassuring|urgent",
  "channel": "email|sms|portal"
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
          { role: "system", content: "You are a construction communication AI. Always respond with valid JSON. Be professional and clear." },
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

    const commResult = JSON.parse(result);

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "communication_scheduler",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId, event, recipient, context },
      output: commResult,
      status: "completed"
    });

    console.log("Communication scheduled for project:", projectId);

    return new Response(
      JSON.stringify(commResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-communication-scheduler:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
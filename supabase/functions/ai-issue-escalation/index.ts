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
      riskScore,
      contractorResponsiveness,
      subResponsiveness,
      materialDelays,
      inspections,
      messages
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

    const prompt = `You are SmartReno's AI Issue Escalation Agent. Determine if a situation requires urgent human intervention.

PROJECT ID: ${projectId}

RISK SCORE: ${riskScore || 0}/100

CONTRACTOR RESPONSIVENESS:
${JSON.stringify(contractorResponsiveness, null, 2)}

SUB RESPONSIVENESS:
${JSON.stringify(subResponsiveness, null, 2)}

MATERIAL DELAYS:
${JSON.stringify(materialDelays, null, 2)}

INSPECTIONS:
${JSON.stringify(inspections, null, 2)}

RECENT MESSAGES:
${JSON.stringify(messages, null, 2)}

Provide a JSON response with:
{
  "escalation_required": true/false,
  "priority": "low|medium|high|critical",
  "recommended_contact": "Who should be contacted",
  "reason": "Why escalation is needed",
  "action_items": ["action1", "action2"]
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
          { role: "system", content: "You are a construction issue escalation AI. Always respond with valid JSON. Be conservative - escalate when in doubt." },
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

    const escalationReport = JSON.parse(result);

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "issue_escalation",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        riskScore,
        contractorResponsiveness,
        subResponsiveness,
        materialDelays,
        inspections,
        messageCount: messages?.length || 0
      },
      output: escalationReport,
      status: "completed"
    });

    console.log("Escalation check completed for project:", projectId);

    return new Response(
      JSON.stringify(escalationReport),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-issue-escalation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

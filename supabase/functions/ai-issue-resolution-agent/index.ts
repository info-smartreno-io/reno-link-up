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
      issueDetails, 
      timeline, 
      messages, 
      contractorResponsiveness, 
      subResponsiveness 
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

    const prompt = `You are SmartReno's Issue Resolution AI Coordinator. Analyze and resolve construction project issues.

PROJECT ID: ${projectId}

ISSUE DETAILS:
${JSON.stringify(issueDetails, null, 2)}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

MESSAGES:
${JSON.stringify(messages, null, 2)}

CONTRACTOR RESPONSIVENESS: ${contractorResponsiveness}
SUB RESPONSIVENESS: ${subResponsiveness}

Common issues to handle:
- Contractor unresponsive
- Sub not showing
- Failed inspections
- Wrong materials delivered
- Water damage
- Structural surprises
- Homeowner disputes

Provide a JSON response with:
{
  "root_cause": "Analysis of the issue",
  "recommended_steps": ["Step1", "Step2", "Step3"],
  "draft_messages": {
    "homeowner": "Professional explanation",
    "contractor": "Action required",
    "sub": "Follow-up message"
  },
  "timeline_impact": "Impact description",
  "escalation_needed": true/false,
  "severity": "low|medium|high|critical"
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
          { role: "system", content: "You are a construction issue resolution AI. Always respond with valid JSON. Be solution-oriented." },
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

    const resolutionResult = JSON.parse(result);

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "issue_resolution",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId, issueDetails },
      output: resolutionResult,
      status: "completed",
      autonomous_decision: true,
      approval_status: resolutionResult.escalation_needed ? "requires_approval" : "auto_approved"
    });

    console.log("Issue resolution analysis completed for project:", projectId);

    return new Response(
      JSON.stringify(resolutionResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-issue-resolution-agent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
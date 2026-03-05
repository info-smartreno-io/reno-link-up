import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractorId, activeProjects, rfps, messages, recentActivity } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a construction project workflow assistant helping contractors stay organized and proactive.

Guidelines:
- Analyze contractor workload and suggest top 5 priority actions
- Identify overdue tasks, pending RFPs, and upcoming deadlines
- Suggest proactive homeowner/PM communications (never auto-send)
- Flag escalation risks (delays, budget issues, scheduling conflicts)
- Prioritize by urgency and business impact
- Keep suggestions actionable and specific

Output format:
- tasks: priority-sorted action items
- message_suggestions: draft messages (contractor reviews before sending)
- deadlines: upcoming critical dates
- escalations: items requiring immediate attention`;

    const userPrompt = `Contractor Context:
- Active Projects: ${activeProjects?.length || 0}
- Open RFPs: ${rfps?.length || 0}
- Recent Messages: ${messages?.length || 0}
- Recent Activity: ${JSON.stringify(recentActivity)}

Projects: ${JSON.stringify(activeProjects)}
RFPs: ${JSON.stringify(rfps)}
Messages: ${JSON.stringify(messages)}

Generate workflow recommendations with:
1. tasks: array of {priority: "high"|"medium"|"low", text: string, project_id?: string, type: "bid"|"update"|"schedule"|"approval"}
2. message_suggestions: array of {project_id: string, recipient: "homeowner"|"pm", subject: string, text: string}
3. deadlines: array of {date: string, description: string, priority: string}
4. escalations: array of {project_id: string, issue: string, severity: "high"|"medium"}

Limit to top 5 most important tasks. Return JSON only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const result = JSON.parse(aiResponse.choices[0].message.content);

    // Log AI activity
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase
          .from('ai_agent_activity')
          .insert({
            agent_type: 'contractor_workflow',
            user_id: user.id,
            user_role: 'contractor',
            input: {
              activeProjectsCount: activeProjects?.length || 0,
              rfpsCount: rfps?.length || 0,
              messagesCount: messages?.length || 0
            },
            output: {
              taskCount: result.tasks?.length || 0,
              messageSuggestionsCount: result.message_suggestions?.length || 0,
              escalationsCount: result.escalations?.length || 0
            },
            status: 'completed'
          });
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-contractor-workflow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

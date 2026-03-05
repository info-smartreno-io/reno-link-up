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
    const { projectId, newScope, existingScope, materials, laborRates } = await req.json();

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

    const prompt = `You are SmartReno's Change Order Automation AI. Analyze scope changes and automate change order workflow.

PROJECT ID: ${projectId}

NEW SCOPE:
${JSON.stringify(newScope, null, 2)}

EXISTING SCOPE:
${JSON.stringify(existingScope, null, 2)}

MATERIALS:
${JSON.stringify(materials, null, 2)}

LABOR RATES:
${JSON.stringify(laborRates, null, 2)}

Analyze and provide:
1. Price impact
2. Timeline impact
3. Reason for change
4. Draft change order
5. Messages for homeowner and contractor

Provide a JSON response with:
{
  "change_order": {
    "price_change": "+$X,XXX",
    "timeline_change": "+X days",
    "reason": "Detailed reason"
  },
  "message_homeowner": "Professional explanation",
  "message_contractor": "Work instruction update",
  "approval_required": true/false,
  "risk_level": "low|medium|high"
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
          { role: "system", content: "You are a construction change order AI. Always respond with valid JSON." },
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

    const changeOrderResult = JSON.parse(result);

    // Store in change_order_ai_logs
    await supabase.from("change_order_ai_logs").insert({
      project_id: projectId,
      price_change: parseFloat(changeOrderResult.change_order.price_change.replace(/[+$,]/g, '')) || 0,
      timeline_change_days: parseInt(changeOrderResult.change_order.timeline_change.match(/\d+/)?.[0] || '0'),
      reason: changeOrderResult.change_order.reason,
      message_homeowner: changeOrderResult.message_homeowner,
      message_contractor: changeOrderResult.message_contractor
    });

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "changeorder_automation",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId },
      output: changeOrderResult,
      status: "completed",
      autonomous_decision: true,
      approval_status: "pending"
    });

    console.log("Change order automation completed for project:", projectId);

    return new Response(
      JSON.stringify(changeOrderResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-changeorder-automation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
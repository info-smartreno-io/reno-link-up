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
    const { projectId, milestones, timeline, paymentHistory, projectValue } = await req.json();

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

    const prompt = `You are SmartReno's Payment & Milestone Automation AI. Manage payment schedules and milestone triggers.

PROJECT ID: ${projectId}
PROJECT VALUE: ${projectValue}

MILESTONES:
${JSON.stringify(milestones, null, 2)}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

PAYMENT HISTORY:
${JSON.stringify(paymentHistory, null, 2)}

Analyze and provide:
1. Next payment due
2. Trigger reason
3. Payment reminder message
4. Delay impact if any

Provide a JSON response with:
{
  "next_payment_due": "YYYY-MM-DD",
  "payment_amount": "$X,XXX",
  "trigger_reason": "Milestone completed",
  "auto_message": "Professional payment reminder",
  "delay_impact": "Impact if delayed",
  "payment_schedule": ["milestone1", "milestone2"]
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
          { role: "system", content: "You are a construction payment AI. Always respond with valid JSON." },
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

    const paymentResult = JSON.parse(result);

    // Store in payment_milestone_logs
    await supabase.from("payment_milestone_logs").insert({
      project_id: projectId,
      milestone_name: paymentResult.trigger_reason,
      payment_amount: parseFloat(paymentResult.payment_amount.replace(/[$,]/g, '')) || 0,
      trigger_reason: paymentResult.trigger_reason,
      auto_message: paymentResult.auto_message
    });

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "payment_milestone",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: { projectId },
      output: paymentResult,
      status: "completed"
    });

    console.log("Payment milestone analysis completed for project:", projectId);

    return new Response(
      JSON.stringify(paymentResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-payment-milestone-agent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
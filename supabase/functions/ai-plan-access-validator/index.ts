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
      userId,
      portal,
      requestedFeature
    } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (subError && subError.code !== "PGRST116") {
      console.error("Error fetching subscription:", subError);
    }

    const plan = subscription?.plan || "free";
    
    // Feature access matrix
    const featureAccess: Record<string, string[]> = {
      "ai_bid_assistant": ["pro_plus", "enterprise"],
      "ai_pm_agent": ["pro_plus", "enterprise"],
      "lead_scoring": ["pro_plus", "enterprise"],
      "timeline_ai": ["pro_plus", "home_plus", "enterprise"],
      "design_ai": ["home_plus", "enterprise"],
      "fleet_allocation": ["enterprise"],
      "premium_routing": ["pro_plus", "enterprise"]
    };

    const allowed = !requestedFeature || featureAccess[requestedFeature]?.includes(plan) || false;
    
    const response = {
      allowed,
      plan,
      reason: allowed ? `User has active ${plan} subscription` : "Feature requires upgrade",
      upsell_message: !allowed ? getUpsellMessage(requestedFeature, portal) : undefined
    };

    // Log to AI Hub
    await supabase.from("ai_agent_activity").insert({
      agent_type: "plan_access_validator",
      user_id: user.id,
      user_role: "admin",
      status: "completed",
      input: { userId, portal, requestedFeature },
      output: response,
      plan_used: plan,
      subscription_level: plan
    });

    console.log("Plan access validated:", response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-plan-access-validator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getUpsellMessage(feature: string, portal: string): string {
  const messages: Record<string, string> = {
    "ai_bid_assistant": "Upgrade to Pro+ for AI Bid Assistant",
    "ai_pm_agent": "Upgrade to Pro+ for AI PM Agent",
    "lead_scoring": "Upgrade to Pro+ for AI Lead Scoring",
    "timeline_ai": "Upgrade to Pro+ for AI Timeline Intelligence",
    "design_ai": "Upgrade to Home+ for AI Design Studio",
    "fleet_allocation": "Contact us for Enterprise Fleet Allocation",
    "premium_routing": "Upgrade to Pro+ for Priority Lead Routing"
  };
  
  return messages[feature] || `Upgrade to unlock ${feature}`;
}

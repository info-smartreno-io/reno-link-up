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
    const { zipCode, projectType, squareFootage, roomCount } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const prompt = `You are SmartReno's AI Cost Estimator. Provide a quick, accurate cost estimate for a renovation project.

ZIP CODE: ${zipCode || "General NJ area"}
PROJECT TYPE: ${projectType}
SQUARE FOOTAGE: ${squareFootage || "Not specified"}
ROOM COUNT: ${roomCount || "Not specified"}

Provide a realistic cost range for this renovation in New Jersey, considering:
- Regional labor costs
- Material costs
- Permit requirements
- Typical contractor margins
- Project complexity

Provide a JSON response with:
{
  "low_estimate": 0,
  "mid_estimate": 0,
  "high_estimate": 0,
  "explanation": "Brief explanation of factors affecting cost",
  "next_steps": "Recommended next actions",
  "cta_message": "Compelling call-to-action"
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
          { role: "system", content: "You are a construction cost estimation AI. Always respond with valid JSON. Be accurate and helpful." },
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

    const estimateResult = JSON.parse(result);

    // Store estimate
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip");
    const userAgent = req.headers.get("user-agent");

    await supabase.from("website_cost_estimates").insert({
      zip_code: zipCode,
      project_type: projectType,
      square_footage: squareFootage,
      room_count: roomCount,
      estimated_range: estimateResult,
      ip_address: clientIp,
      user_agent: userAgent
    });

    console.log("Cost estimate generated for:", projectType);

    return new Response(
      JSON.stringify(estimateResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-cost-estimator-widget:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
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
    const { pageUrl, metrics } = await req.json();

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

    const prompt = `You are SmartReno's Website Optimization AI. Analyze page performance and recommend improvements.

PAGE URL: ${pageUrl}

METRICS:
${JSON.stringify(metrics, null, 2)}

Analyze:
1. Bounce rate patterns
2. Scroll depth behavior
3. Time on page
4. CTA performance
5. Content engagement

Provide actionable recommendations for:
- Content improvements
- CTA placement and copy
- AI feature opportunities
- SEO enhancements
- User experience improvements

Provide a JSON response with:
{
  "overall_score": 0-100,
  "critical_issues": ["Issue 1", "Issue 2"],
  "recommendations": [
    {
      "category": "content|cta|ai|seo|ux",
      "priority": "high|medium|low",
      "suggestion": "Specific actionable suggestion",
      "expected_impact": "Expected improvement"
    }
  ],
  "ai_opportunities": ["Where AI features could help"],
  "quick_wins": ["Easy improvements with high impact"]
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
          { role: "system", content: "You are a website optimization AI. Always respond with valid JSON. Be specific and actionable." },
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

    const optimizationReport = JSON.parse(result);

    // Store analysis
    await supabase.from("website_optimization_logs").insert({
      page_url: pageUrl,
      analysis_data: metrics,
      recommendations: optimizationReport.recommendations,
      metrics: {
        overall_score: optimizationReport.overall_score,
        critical_issues: optimizationReport.critical_issues
      }
    });

    console.log("Page optimization analysis completed for:", pageUrl);

    return new Response(
      JSON.stringify(optimizationReport),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-page-optimizer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
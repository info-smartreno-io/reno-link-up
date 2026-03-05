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
    const { location, county } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if we have recent personalization for this location
    const { data: existing } = await supabase
      .from("location_personalizations")
      .select("*")
      .eq("location", location)
      .gte("last_updated", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existing) {
      return new Response(
        JSON.stringify(existing),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are SmartReno's Location Intelligence AI. Create personalized content for website visitors from this area.

LOCATION: ${location}
COUNTY: ${county || "New Jersey"}

Analyze and provide:
1. Popular renovation projects in this area
2. Local architectural styles and preferences
3. Regional pricing adjustments
4. Seasonal renovation recommendations
5. Local permit considerations
6. Community insights

Provide a JSON response with:
{
  "popular_projects": [
    {
      "project_type": "Kitchen Remodel",
      "popularity": "high",
      "typical_cost_range": "$25k-$75k",
      "reason": "Why popular in this area"
    }
  ],
  "local_insights": "Brief paragraph about renovation trends in this area",
  "pricing_adjustments": {
    "labor_multiplier": 1.0,
    "notes": "How local pricing compares to state average"
  },
  "seasonal_notes": "Best times for renovations in this area",
  "hero_message": "Personalized hero section text for visitors from this location"
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
          { role: "system", content: "You are a local construction market intelligence AI. Always respond with valid JSON." },
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

    const personalization = JSON.parse(result);

    // Store personalization
    await supabase.from("location_personalizations").insert({
      location: location,
      county: county,
      popular_projects: personalization.popular_projects,
      local_insights: personalization.local_insights,
      pricing_adjustments: personalization.pricing_adjustments,
      seasonal_notes: personalization.seasonal_notes
    });

    console.log("Location personalization generated for:", location);

    return new Response(
      JSON.stringify(personalization),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-location-personalizer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
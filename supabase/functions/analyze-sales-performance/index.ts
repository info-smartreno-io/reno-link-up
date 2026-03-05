import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { summary, points, comparisonSummary } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log('Analyzing sales performance data:', { summary, comparisonSummary });

    // Build the analysis prompt
    const systemPrompt = `You are a sales performance analyst. Analyze the sales KPI data and provide actionable insights.

Focus on:
1. Significant trends (increases/decreases > 10%)
2. Metrics below or above targets
3. Improvement opportunities
4. Concerning patterns that need attention

Keep insights concise (1-2 sentences each). Be specific with numbers and percentages.`;

    const userPrompt = `Analyze this sales performance data:

Current Period Summary:
- Leads: ${summary.leads}
- Set Rate: ${summary.setRate.toFixed(1)}% (Target: 40%)
- Close Rate: ${summary.closeRate.toFixed(1)}% (Target: 30%)
- Average Ticket: $${summary.avgTicket.toLocaleString()}
- Gross Margin: ${summary.grossMargin.toFixed(1)}% (Target: 45%)

${comparisonSummary ? `Comparison Period:
- Leads: ${comparisonSummary.leads}
- Set Rate: ${comparisonSummary.setRate.toFixed(1)}%
- Close Rate: ${comparisonSummary.closeRate.toFixed(1)}%
- Average Ticket: $${comparisonSummary.avgTicket.toLocaleString()}
- Gross Margin: ${comparisonSummary.grossMargin.toFixed(1)}%

Calculate the percentage changes between periods.` : ''}

Time Series Data (most recent 5 points):
${points.slice(-5).map((p: any) => 
  `${p.label}: ${p.leads} leads, ${p.setRate.toFixed(1)}% set rate, ${p.closeRate.toFixed(1)}% close rate`
).join('\n')}

Provide insights in the following categories. Return exactly 3-5 total insights distributed across categories.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_insights",
              description: "Provide sales performance insights across different categories",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["trend", "opportunity", "warning", "positive"],
                          description: "Type of insight: trend (neutral observation), opportunity (improvement area), warning (concerning pattern), positive (good performance)"
                        },
                        message: {
                          type: "string",
                          description: "The insight message, 1-2 sentences, specific with numbers"
                        },
                        metric: {
                          type: "string",
                          enum: ["leads", "setRate", "closeRate", "avgTicket", "grossMargin", "overall"],
                          description: "Primary metric this insight relates to"
                        }
                      },
                      required: ["type", "message", "metric"],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 5
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_insights" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const insights = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify(insights),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in analyze-sales-performance:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        // Fallback insights if AI fails
        insights: [
          {
            type: "trend",
            message: "Performance analysis temporarily unavailable. Manual review recommended.",
            metric: "overall"
          }
        ]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

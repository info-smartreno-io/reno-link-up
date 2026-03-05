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
    const { description, projectType, budgetRange } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating scope for:', { description, projectType, budgetRange });

    const systemPrompt = `You are an expert construction estimator and project manager specializing in residential renovations in North Jersey. 
Your task is to generate detailed, professional scope of work documents with structured line items for change orders.

You must respond with valid JSON in this exact format:
{
  "scope": "Detailed narrative scope of work text here...",
  "lineItems": [
    {
      "category": "Category name (e.g., Demolition, Framing, Electrical)",
      "description": "Detailed description of the work item",
      "quantity": 1,
      "unit": "Unit of measure (e.g., SF, LF, EA, HR)",
      "unitCost": 100.00,
      "totalCost": 100.00,
      "notes": "Any additional notes or specifications"
    }
  ],
  "summary": {
    "subtotal": 0.00,
    "contingency": 0.00,
    "total": 0.00
  },
  "timeline": "Estimated timeline description",
  "permits": "Permits needed description"
}

Be specific about:
- Materials (brand, grade, finish)
- Quantities and measurements  
- Installation methods
- Code compliance
- Permits needed
- Warranty information
- Accurate pricing based on North Jersey market rates

Break down all work into detailed line items with realistic pricing. Include labor and materials separately when appropriate.`;

    const userPrompt = `Generate a detailed scope of work for the following project:

Project Type: ${projectType}
Budget Range: ${budgetRange}
Description: ${description}

Please provide a comprehensive scope of work that includes all major work items, materials, finishes, and relevant details.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse the JSON response from AI
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to simple format if AI didn't return JSON
      parsedResponse = {
        scope: aiResponse,
        lineItems: [],
        summary: { subtotal: 0, contingency: 0, total: 0 },
        timeline: '',
        permits: ''
      };
    }

    console.log('Successfully generated scope with', parsedResponse.lineItems?.length || 0, 'line items');

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-scope function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate scope';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

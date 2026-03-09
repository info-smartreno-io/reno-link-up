import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, projectType, budgetRange, photos } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch platform cost codes to give the AI real cost data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: costCodes } = await supabase
      .from('platform_cost_codes')
      .select('cost_code, category, subcategory, description, trade, unit_type, labor_cost_low, labor_cost_high, material_cost_low, material_cost_high, estimated_duration_days, schedule_phase')
      .eq('is_active', true)
      .order('cost_code', { ascending: true })
      .limit(500);

    const costCodeContext = costCodes && costCodes.length > 0
      ? `\n\nAVAILABLE PLATFORM COST CODES (use these exact codes and descriptions when matching scope items):\n${costCodes.map(cc =>
          `${cc.cost_code} | ${cc.category}/${cc.subcategory || ''} | ${cc.description} | Trade: ${cc.trade} | Unit: ${cc.unit_type} | Labor: $${cc.labor_cost_low}-$${cc.labor_cost_high} | Material: $${cc.material_cost_low}-$${cc.material_cost_high} | Duration: ${cc.estimated_duration_days || '?'}d | Phase: ${cc.schedule_phase || 'N/A'}`
        ).join('\n')}`
      : '';

    console.log('Generating scope for:', { description, projectType, budgetRange, costCodesAvailable: costCodes?.length || 0 });

    const systemPrompt = `You are an expert construction estimator and project manager specializing in residential renovations in North Jersey.
Your task is to generate detailed, professional scope of work documents with structured line items.

${costCodeContext ? `IMPORTANT: Match each line item to a platform cost code when possible. Use the cost code's pricing ranges as your guide. If no matching cost code exists, create a custom entry.` : ''}

You must respond with valid JSON in this exact format:
{
  "scope": "Detailed narrative scope of work text here...",
  "lineItems": [
    {
      "costCode": "The matching platform cost code (e.g., 06.01.02) or 'CUSTOM' if none match",
      "category": "Category name (e.g., Demolition, Framing, Electrical)",
      "trade": "Trade responsible (e.g., Framing, Plumbing, Electrical)",
      "description": "Detailed description of the work item",
      "quantity": 1,
      "unit": "Unit of measure (e.g., SF, LF, EA, HR)",
      "laborCostLow": 0.00,
      "laborCostHigh": 0.00,
      "materialCostLow": 0.00,
      "materialCostHigh": 0.00,
      "unitCost": 100.00,
      "totalCost": 100.00,
      "schedulePhase": "Phase (e.g., Demolition, Rough-In, Finishes)",
      "estimatedDays": 1,
      "notes": "Any additional notes or specifications"
    }
  ],
  "summary": {
    "subtotal": 0.00,
    "contingency": 0.00,
    "total": 0.00
  },
  "timeline": "Estimated timeline description",
  "permits": "Permits needed description",
  "estimatedDurationDays": 30
}

Be specific about:
- Materials (brand, grade, finish)
- Quantities and measurements
- Installation methods
- Code compliance
- Permits needed
- Warranty information
- Accurate pricing based on North Jersey market rates
- Trade assignments and scheduling phases

Break down all work into detailed line items with realistic pricing. Include labor and materials separately.
${costCodeContext}`;

    const userPrompt = `Generate a detailed scope of work for the following project:

Project Type: ${projectType}
Budget Range: ${budgetRange}
Description: ${description}
${photos && photos.length > 0 ? `\nPhotos provided: ${photos.length} site photos included for reference.` : ''}

Please provide a comprehensive scope of work that includes all major work items, materials, finishes, and relevant details. Match to platform cost codes where possible.`;

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
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
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

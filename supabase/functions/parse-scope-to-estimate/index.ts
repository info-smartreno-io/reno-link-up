import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scope, projectType, budgetRange } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client to fetch pricing data
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    console.log('Fetching pricing guide from database...');
    
    // Fetch pricing guide from database
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing_guide')
      .select('*')
      .eq('region', 'north-jersey');

    if (pricingError) {
      console.error('Error fetching pricing guide:', pricingError);
    }

    const pricingGuide = pricingData || [];
    console.log(`Loaded ${pricingGuide.length} pricing items`);

    console.log('Parsing scope for line items:', { projectType, budgetRange });

    // Prepare pricing guide summary for AI
    const pricingContext = pricingGuide.map(p => 
      `${p.item_name}: $${p.material_cost} materials + $${p.labor_cost} labor per ${p.unit}`
    ).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert construction estimator specializing in residential renovations in North Jersey. Your task is to analyze scope of work documents and extract detailed line items with accurate pricing.

PRICING DATABASE - Use these EXACT prices when matching items from the scope:
${pricingContext}

When analyzing a scope, you must:
1. Extract all work items mentioned
2. Match items to the pricing database whenever possible for accurate costs
3. For items not in the pricing database, estimate realistic North Jersey pricing (2024-2025 rates)
4. Estimate realistic quantities based on typical project sizes
5. Break down into materials and labor
6. Include permits, fees, and contingency (10% of subtotal)

IMPORTANT: 
- Use pricing database values when available for accuracy
- Only estimate pricing for items not in the database
- Be specific about quantities and units

Return ONLY valid JSON with no additional text. Use this exact structure:
{
  "lineItems": [
    {
      "description": "Item name",
      "quantity": number,
      "unit": "unit type",
      "materialCost": number,
      "laborCost": number,
      "totalCost": number
    }
  ],
  "summary": {
    "totalMaterials": number,
    "totalLabor": number,
    "permitsAndFees": number,
    "contingency": number,
    "grandTotal": number
  }
}` 
          },
          { 
            role: 'user', 
            content: `Parse this scope of work and extract line items with pricing. Use the pricing database for accurate costs:

Project Type: ${projectType}
Budget Range: ${budgetRange}

Scope of Work:
${scope}

Extract all work items with realistic pricing. Return ONLY the JSON structure specified.` 
          }
        ],
        temperature: 0.3,
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
    const content = data.choices[0].message.content;

    console.log('Raw AI response:', content);

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').trim();
    }

    const parsedData = JSON.parse(jsonStr);

    console.log('Successfully parsed scope to estimate');

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-scope-to-estimate function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse scope';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

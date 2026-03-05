import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      estimate = {},
      marketData = {},
      contractorBidHistory = [],
      projectType = '',
      zipCode = ''
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing pricing and margins for:', projectType, zipCode);

    // Build AI prompt
    const prompt = `You are an expert pricing analyst for a home renovation platform.

Analyze this estimate and provide pricing optimization recommendations:

Estimate Details: ${JSON.stringify(estimate).substring(0, 800)}
Market Data: ${JSON.stringify(marketData)}
Contractor Bid History: ${JSON.stringify(contractorBidHistory).substring(0, 500)}
Project Type: ${projectType}
Zip Code: ${zipCode}

Based on this information, provide pricing intelligence:

1. **Pricing Adjustment**: Percentage recommendation (e.g., "+6.5%" or "-3.2%")
2. **Risk Assessment**: 
   - risk_of_underpricing: low, medium, or high
   - risk_of_overpricing: low, medium, or high
3. **Margin Optimization**:
   - suggested_fee: Recommended SmartReno service fee percentage
   - expected_gross_profit: Estimated profit in dollars
4. **Market Insights**: Brief notes on local market conditions
5. **Line Item Flags**: Any specific costs that seem too high or too low

Return your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "pricing_adjustment": "+6.5%",
  "risk_of_underpricing": "high",
  "risk_of_overpricing": "low",
  "margin_optimization": {
    "suggested_fee": 3.2,
    "expected_gross_profit": 1325
  },
  "market_insights": "Bathroom remodeling in this zip code has seen 8% labor cost increases due to high demand",
  "line_item_flags": [
    "Tile installation seems 15% below market rate"
  ],
  "reasoning": "Brief explanation of pricing strategy"
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    
    let pricingAnalysis;
    try {
      pricingAnalysis = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        pricingAnalysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Pricing analysis result:', pricingAnalysis);

    // Save pricing adjustment to database
    const { error: saveError } = await supabase
      .from('pricing_adjustments')
      .insert({
        project_type: projectType,
        zip_code: zipCode,
        pricing_adjustment: pricingAnalysis.pricing_adjustment,
        risk_level: pricingAnalysis.risk_of_underpricing,
        suggested_fee: pricingAnalysis.margin_optimization?.suggested_fee,
        expected_gross_profit: pricingAnalysis.margin_optimization?.expected_gross_profit,
        ai_notes: pricingAnalysis.market_insights,
      });

    if (saveError) {
      console.error('Error saving pricing adjustment:', saveError);
    }

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'PricingOptimizationAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        status: 'completed',
        input: { projectType, zipCode, estimate },
        output: pricingAnalysis,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(pricingAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-margin-pricing-engine:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

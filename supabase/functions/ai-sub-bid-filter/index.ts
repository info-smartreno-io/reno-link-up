import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, scope, trade, photos, notes } = await req.json();

    console.log('Sub Bid Filter - Input:', { projectId, trade, scopeKeys: Object.keys(scope || {}) });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI assistant helping subcontractors filter project scopes to their specific trade.

Your task: Analyze the full project scope and extract ONLY items relevant to the specified trade.

For each trade-relevant item, provide:
1. Line item description
2. Quantity suggestion (based on scope/photos)
3. Unit (sqft, lf, each, etc.)
4. Notes and assumptions
5. Optional add-ons

Also identify:
- Missing items the sub should consider
- Risk flags from photos/notes
- Trade-specific warnings

Output structured JSON with:
{
  "trade_items": [
    {
      "description": "string",
      "quantity": "number",
      "unit": "string",
      "notes": "string",
      "optional_addon": "boolean"
    }
  ],
  "missing_items": ["string"],
  "warnings": ["string"]
}`;

    const userPrompt = `Trade: ${trade}

Project Scope:
${JSON.stringify(scope, null, 2)}

Contractor Notes:
${notes || 'None provided'}

Photos Available: ${photos?.length || 0}

Please extract only ${trade}-specific work items and generate a draft bid scope.`;

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
        tools: [{
          type: "function",
          function: {
            name: "generate_trade_scope",
            description: "Return trade-specific scope with items, missing items, and warnings.",
            parameters: {
              type: "object",
              properties: {
                trade_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      quantity: { type: "string" },
                      unit: { type: "string" },
                      notes: { type: "string" },
                      optional_addon: { type: "boolean" }
                    },
                    required: ["description", "quantity", "unit"],
                    additionalProperties: false
                  }
                },
                missing_items: {
                  type: "array",
                  items: { type: "string" }
                },
                warnings: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["trade_items", "missing_items", "warnings"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_trade_scope" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Log to AI activity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (user) {
      await supabase.from('ai_agent_activity').insert({
        agent_type: 'SubBidAgent',
        user_id: user.id,
        user_role: 'subcontractor',
        project_id: projectId,
        status: 'completed',
        input: { trade, projectId },
        output: { item_count: result.trade_items?.length || 0 }
      });
    }

    console.log('Sub Bid Filter - Success:', { itemCount: result.trade_items?.length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Sub bid filter error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

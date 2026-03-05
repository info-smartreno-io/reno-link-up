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
    const { 
      projectId, 
      scope, 
      estimate, 
      timeline, 
      rfps, 
      bids, 
      messages, 
      photos 
    } = await req.json();

    console.log('QA Audit - Input:', { projectId });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI quality assurance agent for construction projects.

Your task: Scan all project data for errors, inconsistencies, missing items, and risks.

Check for:
1. **Scope & Estimate Validation**
   - Missing rooms or construction phases
   - Missing common line items
   - Unusual quantity values
   - Material category conflicts

2. **Pricing & Consistency**
   - Large inconsistencies between similar items
   - Line items missing units
   - Duplicate items
   - Uncategorized line items

3. **Disclaimers**
   - Missing standard disclaimers
   - Missing mandatory cautions (permits, inspections, site conditions)

4. **RFP & Bid QA**
   - Bids missing categories
   - Bids not matching estimator scope
   - Incomplete subcontractor bids

5. **Timeline QA**
   - Tasks missing prerequisites
   - Missing common construction stages
   - Incorrect task overlaps

Calculate a risk score: low, medium, or high based on severity and quantity of issues.

Output structured JSON with:
{
  "issues": [
    {
      "type": "missing_item" | "quantity_flag" | "pricing_inconsistency" | "duplicate" | "category_missing",
      "severity": "low" | "medium" | "high",
      "text": "description",
      "location": "estimate|timeline|rfp|bid"
    }
  ],
  "disclaimer_warnings": ["string"],
  "timeline_warnings": ["string"],
  "bid_mismatches": ["string"],
  "risk_score": "low" | "medium" | "high",
  "recommended_fixes": ["string"]
}`;

    const userPrompt = `Project ID: ${projectId}

Scope:
${JSON.stringify(scope || {}, null, 2)}

Estimate Line Items:
${JSON.stringify(estimate || [], null, 2)}

Timeline:
${JSON.stringify(timeline || [], null, 2)}

RFPs:
${JSON.stringify(rfps || [], null, 2)}

Bids:
${JSON.stringify(bids || [], null, 2)}

Recent Messages:
${JSON.stringify(messages || [], null, 2)}

Photos Available: ${photos?.length || 0}

Run a comprehensive QA audit and identify all issues, inconsistencies, and risks.`;

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
            name: "generate_qa_report",
            description: "Generate comprehensive QA audit report with issues and risk assessment.",
            parameters: {
              type: "object",
              properties: {
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { 
                        type: "string",
                        enum: ["missing_item", "quantity_flag", "pricing_inconsistency", "duplicate", "category_missing"]
                      },
                      severity: {
                        type: "string",
                        enum: ["low", "medium", "high"]
                      },
                      text: { type: "string" },
                      location: { 
                        type: "string",
                        enum: ["estimate", "timeline", "rfp", "bid", "scope"]
                      }
                    },
                    required: ["type", "severity", "text", "location"],
                    additionalProperties: false
                  }
                },
                disclaimer_warnings: {
                  type: "array",
                  items: { type: "string" }
                },
                timeline_warnings: {
                  type: "array",
                  items: { type: "string" }
                },
                bid_mismatches: {
                  type: "array",
                  items: { type: "string" }
                },
                risk_score: {
                  type: "string",
                  enum: ["low", "medium", "high"]
                },
                recommended_fixes: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["issues", "disclaimer_warnings", "timeline_warnings", "bid_mismatches", "risk_score", "recommended_fixes"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_qa_report" } }
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
        agent_type: 'QAAudit',
        user_id: user.id,
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId },
        output: { 
          issue_count: result.issues?.length || 0,
          risk_score: result.risk_score 
        }
      });
    }

    console.log('QA Audit - Success:', { 
      issueCount: result.issues?.length,
      riskScore: result.risk_score 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('QA audit error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

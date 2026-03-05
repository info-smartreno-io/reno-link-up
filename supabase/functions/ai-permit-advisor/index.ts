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
      projectAddress, 
      municipality, 
      workTypes, 
      photos 
    } = await req.json();

    console.log('Permit Advisor - Input:', { projectId, municipality });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI permit advisor for New Jersey construction projects.

Your task: Analyze project details and determine all required permits, forms, and documentation.

Identify:
1. **Required NJ State Subcodes**
   - Building (UCC)
   - Fire
   - Electrical
   - Plumbing
   - Mechanical
   - Zoning
   - Elevator (if applicable)
   - Environmental (if applicable)

2. **Required Forms**
   Based on municipality and project type:
   - UCC permit applications
   - Building subcode forms
   - Electrical subcode forms
   - Plumbing subcode forms
   - Mechanical subcode forms
   - Zoning compliance
   - Required checklists

3. **Inspection Sequence**
   Standard NJ construction inspection order:
   - Demo
   - Rough framing
   - Rough electric
   - Rough plumbing
   - Rough HVAC
   - Insulation
   - Final inspections (building + all trades)

4. **Missing Documentation**
   - Required photos not provided
   - Site plans
   - Architect drawings
   - Survey
   - Engineering letters
   - Other requirements

Output structured JSON with:
{
  "required_permits": ["string"],
  "required_forms": ["string"],
  "inspection_sequence": [
    {
      "phase": "string",
      "description": "string",
      "typically_days_after_start": number
    }
  ],
  "missing_documents": ["string"],
  "municipality_notes": "string",
  "estimated_approval_days": number
}`;

    const userPrompt = `Project Address: ${projectAddress}
Municipality: ${municipality}

Scope:
${JSON.stringify(scope || {}, null, 2)}

Work Types:
${JSON.stringify(workTypes || [], null, 2)}

Photos Available: ${photos?.length || 0}

Analyze this NJ construction project and determine all required permits, forms, inspections, and missing documentation.`;

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
            name: "analyze_permit_requirements",
            description: "Analyze NJ construction project and determine required permits and documentation.",
            parameters: {
              type: "object",
              properties: {
                required_permits: {
                  type: "array",
                  items: { type: "string" }
                },
                required_forms: {
                  type: "array",
                  items: { type: "string" }
                },
                inspection_sequence: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      phase: { type: "string" },
                      description: { type: "string" },
                      typically_days_after_start: { type: "number" }
                    },
                    required: ["phase", "description", "typically_days_after_start"],
                    additionalProperties: false
                  }
                },
                missing_documents: {
                  type: "array",
                  items: { type: "string" }
                },
                municipality_notes: { type: "string" },
                estimated_approval_days: { type: "number" }
              },
              required: ["required_permits", "required_forms", "inspection_sequence", "missing_documents", "municipality_notes", "estimated_approval_days"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_permit_requirements" } }
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

    // Fetch municipality contact info from database if available
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: municipalityData } = await supabase
      .from('municipalities')
      .select('*')
      .ilike('name', municipality)
      .single();

    result.municipality_contact = municipalityData || {
      name: municipality,
      note: 'Contact information not yet in database'
    };

    // Log to AI activity
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (user) {
      await supabase.from('ai_agent_activity').insert({
        agent_type: 'PermitAdvisor',
        user_id: user.id,
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, municipality },
        output: { 
          permit_count: result.required_permits?.length || 0,
          missing_items: result.missing_documents?.length || 0
        }
      });
    }

    console.log('Permit Advisor - Success:', { 
      permitCount: result.required_permits?.length,
      missingDocs: result.missing_documents?.length
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Permit advisor error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

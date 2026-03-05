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
      contractorAvailability, 
      subAvailability, 
      materialLeadTimes, 
      projectType 
    } = await req.json();

    console.log('Timeline Generator - Input:', { projectId, projectType });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI construction project timeline generator.

Your task: Create a detailed, realistic project timeline with:
1. Sequential phases (Demo, Framing, MEP, Insulation, Drywall, Finishes, etc.)
2. Duration estimates for each task
3. Dependencies (what must finish before what starts)
4. Material lead time integration
5. Contractor/sub availability windows
6. Critical path identification
7. Red flags and potential delays

Consider:
- Standard construction sequences
- Inspection requirements
- Weather/seasonal factors
- Material procurement timing

Output structured JSON with:
{
  "milestones": [
    {
      "name": "string",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD", 
      "duration_days": number,
      "dependencies": ["string"],
      "assigned_trade": "string"
    }
  ],
  "critical_path": ["milestone_name"],
  "red_flags": ["string"],
  "total_duration_days": number
}`;

    const userPrompt = `Project Type: ${projectType}

Scope Summary:
${JSON.stringify(scope, null, 2)}

Contractor Availability:
${JSON.stringify(contractorAvailability || [], null, 2)}

Sub Availability:
${JSON.stringify(subAvailability || [], null, 2)}

Material Lead Times:
${JSON.stringify(materialLeadTimes || [], null, 2)}

Generate a complete project timeline with realistic durations and dependencies.`;

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
            name: "generate_timeline",
            description: "Generate complete project timeline with milestones and dependencies.",
            parameters: {
              type: "object",
              properties: {
                milestones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      start_date: { type: "string" },
                      end_date: { type: "string" },
                      duration_days: { type: "number" },
                      dependencies: { 
                        type: "array",
                        items: { type: "string" }
                      },
                      assigned_trade: { type: "string" }
                    },
                    required: ["name", "start_date", "end_date", "duration_days"],
                    additionalProperties: false
                  }
                },
                critical_path: {
                  type: "array",
                  items: { type: "string" }
                },
                red_flags: {
                  type: "array",
                  items: { type: "string" }
                },
                total_duration_days: { type: "number" }
              },
              required: ["milestones", "critical_path", "red_flags", "total_duration_days"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_timeline" } }
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
        agent_type: 'SmartTimeline',
        user_id: user.id,
        user_role: 'project_manager',
        project_id: projectId,
        status: 'completed',
        input: { projectType, projectId },
        output: { milestone_count: result.milestones?.length || 0 }
      });
    }

    console.log('Timeline Generator - Success:', { milestoneCount: result.milestones?.length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Timeline generator error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

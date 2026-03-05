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
      recentActivity, 
      timeline, 
      delays, 
      notes,
      messageType = 'homeowner' // 'homeowner' or 'subcontractor'
    } = await req.json();

    console.log('Communication Helper - Input:', { projectId, messageType });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI assistant helping construction project managers draft professional updates.

Your task: Generate clear, professional communication for homeowners and subcontractors.

For homeowner updates, include:
1. Current project status
2. What was completed recently
3. What's coming next
4. Any required approvals or decisions
5. Delay explanations (if any) with transparency
6. Positive, reassuring tone

For subcontractor updates, include:
1. Tasks pending/upcoming
2. Material availability status
3. Inspection dates
4. Coordination needs
5. Direct, action-oriented tone

Provide 3 variations: Short, Medium, Detailed

Output structured JSON with:
{
  "homeowner_message": "string",
  "subcontractor_message": "string",
  "alternate_versions": {
    "short": "string",
    "medium": "string", 
    "detailed": "string"
  }
}`;

    const userPrompt = `Message Type: ${messageType}

Recent Activity:
${JSON.stringify(recentActivity || [], null, 2)}

Timeline:
${JSON.stringify(timeline || [], null, 2)}

Delays:
${JSON.stringify(delays || [], null, 2)}

Notes:
${notes || 'None provided'}

Generate professional update messages.`;

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
            name: "draft_update_messages",
            description: "Generate professional homeowner and subcontractor update messages.",
            parameters: {
              type: "object",
              properties: {
                homeowner_message: { type: "string" },
                subcontractor_message: { type: "string" },
                alternate_versions: {
                  type: "object",
                  properties: {
                    short: { type: "string" },
                    medium: { type: "string" },
                    detailed: { type: "string" }
                  },
                  required: ["short", "medium", "detailed"],
                  additionalProperties: false
                }
              },
              required: ["homeowner_message", "subcontractor_message", "alternate_versions"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "draft_update_messages" } }
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
        agent_type: 'CommunicationAgent',
        user_id: user.id,
        user_role: 'project_manager',
        project_id: projectId,
        status: 'completed',
        input: { messageType, projectId },
        output: { messages_generated: 2 }
      });
    }

    console.log('Communication Helper - Success');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Communication helper error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

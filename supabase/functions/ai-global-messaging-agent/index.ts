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
      projectId,
      eventType,
      context = {},
      recipient
    } = await req.json();

    if (!eventType || !recipient) {
      throw new Error('eventType and recipient are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating message:', eventType, 'for', recipient);

    // Build AI prompt based on event type and recipient
    const prompt = `You are a professional communication assistant for a home renovation platform.

Generate a message for the following scenario:

Event Type: ${eventType}
Recipient: ${recipient}
Project Context: ${JSON.stringify(context).substring(0, 800)}

Message Requirements:
- Professional but friendly tone
- Clear and concise
- Action-oriented when appropriate
- Empathetic to concerns
- Maintains trust and transparency

Event Types Guide:
- "delay": Explain delay, new timeline, and next steps
- "milestone": Celebrate completion, what's next
- "material_issue": Explain material delay/issue, resolution plan
- "walkthrough_complete": Summary of findings, next actions
- "change_order": Explain changes, cost/timeline impact
- "timeline_update": Share revised schedule
- "payment_reminder": Professional payment request
- "inspection_scheduled": Date, time, what to expect

Recipient-specific tone:
- homeowner: Warm, reassuring, explain in simple terms
- contractor: Direct, professional, action-focused
- pm: Collaborative, detail-oriented

Return your message in this exact JSON format (no markdown, just raw JSON):
{
  "message": "The actual message text here",
  "severity": "update|important|urgent",
  "suggested_follow_up": "Optional next step suggestion"
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
    
    let messageResult;
    try {
      messageResult = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        messageResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    console.log('Message generated:', messageResult);

    // Log to AI Hub
    const { error: logError } = await supabase
      .from('ai_agent_activity')
      .insert({
        agent_type: 'GlobalMessagingAI',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_role: 'admin',
        project_id: projectId,
        status: 'completed',
        input: { projectId, eventType, recipient, context },
        output: messageResult,
      });

    if (logError) {
      console.error('Error logging to AI Hub:', logError);
    }

    return new Response(
      JSON.stringify(messageResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-global-messaging-agent:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

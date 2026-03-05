import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

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
      contractorId,
      projectSummary,
      attachments = []
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    console.log("Auto-sending RFP for project:", projectId, "to contractor:", contractorId);

    // Generate personalized message
    const prompt = `Create a personalized RFP message for this contractor.

Project ID: ${projectId}
Contractor ID: ${contractorId}
Project Summary: ${projectSummary}

Make it professional, clear, and highlight why this contractor is a good fit.
Include: project scope, timeline expectations, and next steps.

Return just the message text.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const personalizedMessage = aiResult.choices?.[0]?.message?.content || '';

    // Schedule follow-up in 3 days
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 3);

    // Record RFP send
    const { data: rfpRecord } = await supabase.from('rfp_auto_sends').insert({
      project_id: projectId,
      contractor_id: contractorId,
      status: 'sent',
      sent_at: new Date().toISOString(),
      follow_up_scheduled: true,
      next_follow_up: followUpDate.toISOString().split('T')[0],
      personalized_message: personalizedMessage
    }).select().single();

    await supabase.from('ai_agent_activity').insert({
      agent_type: 'rfp_sender',
      user_id: user.id,
      user_role: 'admin',
      project_id: projectId,
      status: 'completed',
      input: { projectId, contractorId },
      output: { status: 'sent', personalizedMessage }
    });

    return new Response(
      JSON.stringify({
        status: 'sent',
        follow_up_scheduled: true,
        next_follow_up: followUpDate.toISOString().split('T')[0],
        message: personalizedMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-rfp-sender:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
    const { sessionId, message, conversationHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const systemPrompt = `You are SmartReno AI, a helpful renovation advisor on the SmartReno website.

You can help with:
- Common renovation questions
- Permit requirements in New Jersey
- Cost estimates and budgeting
- Material suggestions and comparisons
- Design advice
- Financing options
- Project timelines
- Choosing the right contractor

Be friendly, professional, and concise. Always encourage users to "Book a Free Consultation" for detailed estimates.

Keep responses under 100 words. Be helpful but guide towards booking an estimator visit for accurate quotes.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Update conversation in database
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip");
    
    const { data: existingConv } = await supabase
      .from("website_chat_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    const updatedMessages = [
      ...(existingConv?.messages || []),
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() }
    ];

    if (existingConv) {
      await supabase
        .from("website_chat_conversations")
        .update({
          messages: updatedMessages,
          last_message_at: new Date().toISOString()
        })
        .eq("session_id", sessionId);
    } else {
      await supabase.from("website_chat_conversations").insert({
        session_id: sessionId,
        messages: updatedMessages,
        ip_address: clientIp,
        last_message_at: new Date().toISOString()
      });
    }

    console.log("Website chat response generated for session:", sessionId);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-website-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { messageId, mentionedUserIds, senderId, messageContent, channelName } = await req.json();

    console.log('Processing mentions for message:', messageId);

    // Get sender info
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', senderId)
      .single();

    const senderName = senderProfile?.full_name || senderProfile?.email || 'Someone';

    // Create mention records and send notifications
    for (const userId of mentionedUserIds) {
      // Create mention record
      await supabase
        .from('chat_message_mentions')
        .insert({
          message_id: messageId,
          mentioned_user_id: userId,
        });

      // Get mentioned user's email
      const { data: mentionedProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (!mentionedProfile?.email) {
        console.log('No email found for user:', userId);
        continue;
      }

      console.log('Sending notification to:', mentionedProfile.email);

      // Send email notification via Resend
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        continue;
      }

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'SmartReno Team <notifications@smartreno.io>',
          to: [mentionedProfile.email],
          subject: `${senderName} mentioned you in ${channelName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">You were mentioned in Team Chat</h2>
              <p style="color: #666; font-size: 16px;">
                <strong>${senderName}</strong> mentioned you in <strong>${channelName}</strong>:
              </p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #333; margin: 0;">${messageContent}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                Log in to SmartReno to view the full conversation and reply.
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const error = await emailRes.text();
        console.error('Failed to send email:', error);
      } else {
        console.log('Email sent successfully to:', mentionedProfile.email);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing mentions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

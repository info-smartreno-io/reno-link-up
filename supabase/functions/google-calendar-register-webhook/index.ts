import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accessToken, userId, calendarId = 'primary' } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a unique channel ID
    const channelId = `smartreno-${userId}-${Date.now()}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/google-calendar-webhook`;

    console.log('Registering webhook:', {
      channelId,
      webhookUrl,
      calendarId
    });

    // Register webhook with Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          // Webhook expires after 7 days (max allowed by Google)
          expiration: Date.now() + (7 * 24 * 60 * 60 * 1000),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to register webhook:', error);
      throw new Error(`Failed to register webhook: ${error}`);
    }

    const data = await response.json();
    console.log('Webhook registered successfully:', data);

    // Store webhook information in database
    const { error: insertError } = await supabase
      .from('google_calendar_webhooks')
      .upsert({
        user_id: userId,
        channel_id: channelId,
        resource_id: data.resourceId,
        calendar_id: calendarId,
        expiration: new Date(parseInt(data.expiration)),
      }, {
        onConflict: 'channel_id'
      });

    if (insertError) {
      console.error('Failed to store webhook:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        channelId,
        resourceId: data.resourceId,
        expiration: data.expiration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in register-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

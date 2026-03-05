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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting webhook renewal process...');

    // Find webhooks expiring in the next 24 hours
    const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: expiringWebhooks, error: fetchError } = await supabase
      .from('google_calendar_webhooks')
      .select('*, google_calendar_tokens!inner(access_token)')
      .lt('expiration', expirationThreshold.toISOString());

    if (fetchError) {
      console.error('Failed to fetch expiring webhooks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringWebhooks?.length || 0} webhooks to renew`);

    const results = [];

    for (const webhook of expiringWebhooks || []) {
      try {
        const webhookUrl = `${supabaseUrl}/functions/v1/google-calendar-webhook`;
        const newChannelId = `smartreno-${webhook.user_id}-${Date.now()}`;

        console.log('Renewing webhook:', {
          oldChannelId: webhook.channel_id,
          newChannelId,
          userId: webhook.user_id
        });

        // Stop the old webhook
        try {
          await fetch(
            'https://www.googleapis.com/calendar/v3/channels/stop',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${webhook.google_calendar_tokens.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: webhook.channel_id,
                resourceId: webhook.resource_id,
              }),
            }
          );
        } catch (stopError) {
          console.error('Failed to stop old webhook (continuing anyway):', stopError);
        }

        // Register new webhook
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(webhook.calendar_id)}/events/watch`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${webhook.google_calendar_tokens.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: newChannelId,
              type: 'web_hook',
              address: webhookUrl,
              expiration: Date.now() + (7 * 24 * 60 * 60 * 1000),
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to register new webhook:', error);
          results.push({
            userId: webhook.user_id,
            success: false,
            error: error,
          });
          continue;
        }

        const data = await response.json();

        // Update webhook in database
        const { error: updateError } = await supabase
          .from('google_calendar_webhooks')
          .update({
            channel_id: newChannelId,
            resource_id: data.resourceId,
            expiration: new Date(parseInt(data.expiration)),
          })
          .eq('id', webhook.id);

        if (updateError) {
          console.error('Failed to update webhook in database:', updateError);
          results.push({
            userId: webhook.user_id,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log('Successfully renewed webhook for user:', webhook.user_id);
          results.push({
            userId: webhook.user_id,
            success: true,
            newChannelId,
          });
        }

      } catch (error: any) {
        console.error('Error renewing webhook:', error);
        results.push({
          userId: webhook.user_id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        renewed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in renew-webhooks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

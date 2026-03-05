import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-resource-uri',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook headers from Google
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceState = req.headers.get('x-goog-resource-state');
    const resourceId = req.headers.get('x-goog-resource-id');

    console.log('Webhook received:', {
      channelId,
      resourceState,
      resourceId,
      method: req.method
    });

    // Verify this is a sync event (initial webhook verification)
    if (resourceState === 'sync') {
      console.log('Webhook sync verification successful');
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle exists/not_exists/update events
    if (resourceState === 'exists' || resourceState === 'update') {
      // Find the webhook subscription in our database
      const { data: webhook, error: webhookError } = await supabase
        .from('google_calendar_webhooks')
        .select('*')
        .eq('channel_id', channelId)
        .single();

      if (webhookError || !webhook) {
        console.error('Webhook not found:', webhookError);
        return new Response('Webhook not found', { 
          status: 404,
          headers: corsHeaders 
        });
      }

      console.log('Processing calendar changes for user:', webhook.user_id);

      // Get the user's access token
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_calendar_tokens')
        .select('access_token')
        .eq('user_id', webhook.user_id)
        .single();

      if (tokenError || !tokenData) {
        console.error('Token not found:', tokenError);
        return new Response('Token not found', { 
          status: 404,
          headers: corsHeaders 
        });
      }

      // Fetch updated events from Google Calendar
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(webhook.calendar_id)}/events?` +
        `timeMin=${oneMonthAgo.toISOString()}&` +
        `timeMax=${oneMonthFromNow.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime`;

      const calendarResponse = await fetch(calendarUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!calendarResponse.ok) {
        const error = await calendarResponse.text();
        console.error('Failed to fetch calendar events:', error);
        return new Response('Failed to fetch events', { 
          status: 500,
          headers: corsHeaders 
        });
      }

      const calendarData = await calendarResponse.json();
      console.log(`Fetched ${calendarData.items?.length || 0} events from Google Calendar`);

      // Sync events to walkthroughs table
      for (const event of calendarData.items || []) {
        if (!event.start?.dateTime) continue;

        // Check if event already exists
        const { data: existingWalkthrough } = await supabase
          .from('walkthroughs')
          .select('id')
          .eq('google_calendar_event_id', event.id)
          .single();

        if (!existingWalkthrough) {
          // Create new walkthrough from calendar event
          const { error: insertError } = await supabase
            .from('walkthroughs')
            .insert({
              google_calendar_event_id: event.id,
              address: event.location || '',
              date: event.start.dateTime,
              notes: event.description || '',
              client_name: event.summary || 'Calendar Event',
              user_id: webhook.user_id,
              status: 'scheduled',
            });

          if (insertError) {
            console.error('Failed to insert walkthrough:', insertError);
          } else {
            console.log('Created walkthrough from calendar event:', event.id);
          }
        } else {
          // Update existing walkthrough
          const { error: updateError } = await supabase
            .from('walkthroughs')
            .update({
              address: event.location || '',
              date: event.start.dateTime,
              notes: event.description || '',
              client_name: event.summary || 'Calendar Event',
            })
            .eq('google_calendar_event_id', event.id);

          if (updateError) {
            console.error('Failed to update walkthrough:', updateError);
          } else {
            console.log('Updated walkthrough from calendar event:', event.id);
          }
        }
      }

      return new Response('Sync completed', { headers: corsHeaders });
    }

    return new Response('OK', { headers: corsHeaders });

  } catch (error: any) {
    console.error('Error in webhook handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

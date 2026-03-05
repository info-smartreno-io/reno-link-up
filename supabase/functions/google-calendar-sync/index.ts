import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'push' | 'pull' | 'webhook';
  accessToken?: string;
  userId?: string;
  walkthroughId?: string;
  googleEventId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, accessToken, userId, walkthroughId, googleEventId }: SyncRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'push') {
      // Push local walkthrough to Google Calendar
      if (!accessToken || !walkthroughId) {
        throw new Error('Missing required parameters for push');
      }

      const { data: walkthrough, error: fetchError } = await supabase
        .from('walkthroughs')
        .select('*')
        .eq('id', walkthroughId)
        .single();

      if (fetchError) throw fetchError;

      const startDateTime = new Date(`${walkthrough.date}T${walkthrough.time || '09:00'}`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

      const calendarEvent = {
        summary: `Walkthrough: ${walkthrough.address || 'Property'}`,
        location: walkthrough.address,
        description: walkthrough.notes || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/New_York',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const method = walkthrough.google_calendar_event_id ? 'PATCH' : 'POST';
      const url = walkthrough.google_calendar_event_id
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${walkthrough.google_calendar_event_id}`
        : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Calendar API error:', error);
        throw new Error('Failed to sync with Google Calendar');
      }

      const googleEvent = await response.json();

      // Update walkthrough with Google Calendar event ID
      await supabase
        .from('walkthroughs')
        .update({ google_calendar_event_id: googleEvent.id })
        .eq('id', walkthroughId);

      return new Response(
        JSON.stringify({ success: true, googleEventId: googleEvent.id }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (action === 'pull') {
      // Pull events from Google Calendar
      if (!accessToken || !userId) {
        throw new Error('Missing required parameters for pull');
      }

      const now = new Date();
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${now.toISOString()}&` +
        `timeMax=${oneMonthFromNow.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events');
      }

      const data = await response.json();
      const events = data.items || [];

      // Sync events to walkthroughs table
      for (const event of events) {
        if (!event.start?.dateTime) continue;

        const startDate = new Date(event.start.dateTime);
        const existingEvent = await supabase
          .from('walkthroughs')
          .select('id')
          .eq('google_calendar_event_id', event.id)
          .maybeSingle();

        if (!existingEvent.data) {
          // Create new walkthrough from Google Calendar event
          await supabase.from('walkthroughs').insert({
            user_id: userId,
            date: startDate.toISOString().split('T')[0],
            time: startDate.toTimeString().split(' ')[0].substring(0, 5),
            address: event.location || '',
            notes: event.description || '',
            status: 'scheduled',
            google_calendar_event_id: event.id,
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, eventsProcessed: events.length }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (action === 'webhook') {
      // Handle Google Calendar webhook notifications
      console.log('Webhook notification received');
      
      // Google Calendar sends notifications when events change
      // You would fetch the updated event and sync it to your database
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in google-calendar-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

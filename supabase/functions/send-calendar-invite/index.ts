import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarInviteRequest {
  to: string;
  walkthrough: {
    id: string;
    date: string;
    time: string;
    address: string;
    notes?: string;
  };
  estimatorName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, walkthrough, estimatorName }: CalendarInviteRequest = await req.json();

    // Create Google Calendar event format
    const startDateTime = new Date(`${walkthrough.date}T${walkthrough.time}`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const calendarEvent = {
      summary: `Walkthrough at ${walkthrough.address}`,
      location: walkthrough.address,
      description: `Property walkthrough with ${estimatorName}\n\n${walkthrough.notes || ''}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: to }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    // Create ICS file content for email attachment
    const icsContent = createICS(calendarEvent, estimatorName);

    // Send via Gmail API or as email attachment
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Walkthrough Scheduled</h2>
          <p>Hello,</p>
          <p>Your property walkthrough has been scheduled:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Date:</strong> ${new Date(walkthrough.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${walkthrough.time}</p>
            <p><strong>Location:</strong> ${walkthrough.address}</p>
            <p><strong>Estimator:</strong> ${estimatorName}</p>
            ${walkthrough.notes ? `<p><strong>Notes:</strong> ${walkthrough.notes}</p>` : ''}
          </div>
          <p>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(walkthrough.address)}" 
               style="background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View on Google Maps
            </a>
          </p>
          <p>Looking forward to seeing you!</p>
          <p>Best regards,<br>${estimatorName}</p>
        </body>
      </html>
    `;

    // Note: To actually send via Gmail, you'd need to use OAuth tokens
    // For now, we'll use a basic email sending approach
    console.log('Calendar invite prepared:', {
      to,
      subject: `Walkthrough Scheduled - ${new Date(walkthrough.date).toLocaleDateString()}`,
      body: emailBody,
      ics: icsContent
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Calendar invite prepared',
        calendarEvent,
        icsContent 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-calendar-invite:', error);
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

function createICS(event: any, organizer: string): string {
  const formatDate = (date: string) => date.replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SmartReno//Walkthrough Calendar//EN
BEGIN:VEVENT
UID:${event.summary.replace(/\s/g, '-')}-${Date.now()}@smartreno.io
DTSTAMP:${formatDate(new Date().toISOString())}
DTSTART:${formatDate(event.start.dateTime)}
DTEND:${formatDate(event.end.dateTime)}
SUMMARY:${event.summary}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
ORGANIZER:CN=${organizer}
ATTENDEE:${event.attendees[0].email}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

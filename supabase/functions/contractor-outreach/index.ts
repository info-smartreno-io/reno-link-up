import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contractor_lead_id, outreach_type } = await req.json();

    // Get contractor lead
    const { data: lead, error: leadError } = await supabase
      .from('contractor_leads')
      .select('*')
      .eq('id', contractor_lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error('Contractor lead not found');
    }

    // Determine outreach template based on status
    let emailSubject = '';
    let emailBody = '';
    let smsBody = '';

    switch (lead.outreach_status) {
      case 'new':
        emailSubject = `🏗️ Grow Your Business with SmartReno in ${lead.service_areas?.[0] || 'Northern NJ'}`;
        emailBody = `Hi ${lead.contact_name || lead.contractor_name},

I noticed your company ${lead.contractor_name} provides excellent ${lead.specialties?.join(', ')} services in Northern NJ. 

SmartReno is building a network of top-rated contractors to connect with pre-qualified homeowners. Unlike other platforms:

✅ No upfront costs or subscriptions
✅ Only pay when you win a project
✅ Compete against just 2-3 other contractors (not 20)
✅ Get detailed project specs before bidding

We're currently onboarding contractors in Bergen, Passaic, Morris, and Essex counties.

Want to learn more? Book a 15-min call: [CALENDAR_LINK]

Or reply to this email with any questions.

Best,
SmartReno Team`;

        smsBody = `Hi ${lead.contact_name || 'there'}! SmartReno is connecting top contractors with pre-qualified homeowners in Northern NJ. No subscriptions, only pay when you win. Interested? Reply YES for more info.`;
        break;

      case 'contacted':
        emailSubject = `Following up: SmartReno Contractor Network`;
        emailBody = `Hi ${lead.contact_name || lead.contractor_name},

I reached out last week about joining SmartReno's contractor network. 

Just a quick follow-up - we're onboarding ${lead.service_areas?.[0] || 'your area'} contractors this month and wanted to make sure you didn't miss out.

Current contractors are averaging $50K+ per project through SmartReno with higher close rates than traditional lead services.

Have 15 minutes this week? [CALENDAR_LINK]

Best,
SmartReno Team`;

        smsBody = `Hi ${lead.contact_name || 'there'}, following up on SmartReno. Still interested in qualified leads in your area? Reply YES to schedule a call.`;
        break;

      default:
        throw new Error('Invalid outreach status for automated outreach');
    }

    // Send email (using Resend)
    if (outreach_type === 'email' || outreach_type === 'both') {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey && lead.email) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'SmartReno <partnerships@smartreno.io>',
            to: [lead.email],
            subject: emailSubject,
            text: emailBody,
          }),
        });

        if (!emailRes.ok) {
          console.error('Failed to send email:', await emailRes.text());
        }

        // Update lead
        await supabase
          .from('contractor_leads')
          .update({
            emails_sent: (lead.emails_sent || 0) + 1,
            last_outreach_date: new Date().toISOString(),
            outreach_status: lead.outreach_status === 'new' ? 'contacted' : lead.outreach_status,
            first_contact_date: lead.first_contact_date || new Date().toISOString(),
          })
          .eq('id', contractor_lead_id);
      }
    }

    // Send SMS (using Twilio)
    if (outreach_type === 'sms' || outreach_type === 'both') {
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (twilioSid && twilioToken && twilioPhone && lead.phone) {
        const smsRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
            },
            body: new URLSearchParams({
              To: lead.phone,
              From: twilioPhone,
              Body: smsBody,
            }),
          }
        );

        if (!smsRes.ok) {
          console.error('Failed to send SMS:', await smsRes.text());
        }

        // Update lead
        await supabase
          .from('contractor_leads')
          .update({
            sms_sent: (lead.sms_sent || 0) + 1,
            last_outreach_date: new Date().toISOString(),
          })
          .eq('id', contractor_lead_id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Outreach sent successfully',
        lead_status: lead.outreach_status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in contractor-outreach:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

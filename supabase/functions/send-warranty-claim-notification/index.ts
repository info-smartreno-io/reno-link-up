import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import React from "https://esm.sh/react@18.3.1";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import { WarrantyNotificationEmail } from "./_templates/warranty-notification-email.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      claim_id,
      new_status,
      old_status,
    } = await req.json();

    console.log('Sending warranty claim notification:', claim_id, 'from', old_status, 'to', new_status);

    // Get claim details
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('warranty_claims')
      .select(`
        *,
        projects (
          name
        )
      `)
      .eq('id', claim_id)
      .single();

    if (claimError) throw claimError;

    // Get homeowner email
    const { data: homeowner, error: homeownerError } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', claim.homeowner_id)
      .single();

    if (homeownerError) {
      console.warn('Could not fetch homeowner profile:', homeownerError);
    }

    const { data: { user: homeownerUser } } = await supabaseAdmin.auth.admin.getUserById(
      claim.homeowner_id
    );

    if (!homeownerUser?.email) {
      throw new Error('Homeowner email not found');
    }

    // Determine next steps message
    let nextSteps = '';
    let scheduledDate = null;

    switch (new_status) {
      case 'new':
        nextSteps = 'Our team will review your claim within 24-48 hours. You will receive another update once the review is complete.';
        break;
      case 'in_review':
        nextSteps = 'Our warranty team is carefully reviewing the details of your claim. We may contact you if additional information is needed.';
        break;
      case 'info_requested':
        nextSteps = 'Please log in to your homeowner portal to provide the additional information we need to process your claim.';
        break;
      case 'scheduled_inspection':
        nextSteps = 'An inspection has been scheduled. You will receive a separate notification with the date and time details.';
        scheduledDate = claim.next_action_due_at;
        break;
      case 'awaiting_contractor':
        nextSteps = 'Your claim has been assigned to a contractor for assessment. They will contact you soon to schedule any necessary repairs.';
        break;
      case 'in_repair':
        nextSteps = 'Work is underway to resolve your warranty issue. The contractor will keep you updated on progress.';
        break;
      case 'resolved':
        nextSteps = 'Your warranty claim has been completed. If you have any concerns about the resolution, please contact us.';
        break;
      case 'denied':
        nextSteps = 'Please review the resolution details. If you have questions about this decision, our team is available to discuss.';
        break;
    }

    // Render email template
    const html = await renderAsync(
      React.createElement(WarrantyNotificationEmail, {
        claimNumber: claim.claim_number,
        homeownerName: homeowner?.full_name || homeownerUser.email.split('@')[0],
        status: new_status,
        issueTitle: claim.reported_issue_title,
        nextSteps,
        scheduledDate,
        resolutionSummary: claim.resolution_summary,
      })
    );

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'SmartReno Warranty <warranty@smartreno.io>',
      to: [homeownerUser.email],
      subject: `Warranty Claim Update - ${claim.claim_number}`,
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Warranty notification email sent successfully:', emailData);

    // If urgent status, also send SMS
    const urgentStatuses = ['scheduled_inspection', 'in_repair', 'resolved'];
    if (urgentStatuses.includes(new_status)) {
      console.log('Triggering SMS notification for urgent status:', new_status);
      
      await supabaseAdmin.functions.invoke('send-warranty-claim-sms', {
        body: {
          claim_id,
          new_status,
          homeowner_phone: claim.homeowner_phone,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, emailData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-warranty-claim-notification:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

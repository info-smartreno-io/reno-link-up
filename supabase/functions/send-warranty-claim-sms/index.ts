import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Twilio from "https://esm.sh/twilio@5.3.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioClient = Twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN')
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { claim_id, new_status } = await req.json();

    console.log('Sending warranty claim SMS for:', claim_id, 'status:', new_status);

    // Get claim details with homeowner info
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

    // Get homeowner user to get phone
    const { data: { user: homeownerUser } } = await supabaseAdmin.auth.admin.getUserById(
      claim.homeowner_id
    );

    // Try to get phone from user metadata
    const phone = homeownerUser?.user_metadata?.phone || homeownerUser?.phone;

    if (!phone) {
      console.log('No phone number found for homeowner, skipping SMS');
      return new Response(
        JSON.stringify({ success: false, message: 'No phone number available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create SMS message based on status
    let message = '';
    
    switch (new_status) {
      case 'scheduled_inspection':
        message = `SmartReno: Your warranty claim ${claim.claim_number} - Inspection scheduled. Check your email for details.`;
        break;
      case 'in_repair':
        message = `SmartReno: Your warranty claim ${claim.claim_number} - Repair work has started. We'll keep you updated.`;
        break;
      case 'resolved':
        message = `SmartReno: Good news! Your warranty claim ${claim.claim_number} has been resolved. Thank you for your patience.`;
        break;
      case 'info_requested':
        message = `SmartReno: Action needed for warranty claim ${claim.claim_number}. Please check your email for details.`;
        break;
      default:
        message = `SmartReno: Update on warranty claim ${claim.claim_number}. Status: ${new_status.replace(/_/g, ' ')}. Check your email for details.`;
    }

    // Send SMS
    const smsResult = await twilioClient.messages.create({
      body: message,
      from: Deno.env.get('TWILIO_PHONE_NUMBER'),
      to: phone,
    });

    console.log('SMS sent successfully:', smsResult.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: smsResult.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-warranty-claim-sms:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

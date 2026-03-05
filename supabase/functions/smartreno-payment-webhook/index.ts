import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

interface PaymentWebhookPayload {
  event: 'payment_completed' | 'payment_failed' | 'payment_refunded';
  job_id: string;
  homeowner_id: string;
  amount_paid: number;
  payment_method?: string;
  paid_at: string;
  transaction_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('SMARTRENO_WEBHOOK_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const payload: PaymentWebhookPayload = JSON.parse(rawBody);

    console.log('Received payment webhook:', {
      event: payload.event,
      job_id: payload.job_id,
      amount_paid: payload.amount_paid
    });

    // Step 1: Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature');
      
      if (!signature) {
        console.error('Missing webhook signature');
        return new Response(
          JSON.stringify({ success: false, error: 'Missing webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Compute expected signature using HMAC-SHA256
      const encoder = new TextEncoder();
      const key = encoder.encode(webhookSecret);
      const message = encoder.encode(rawBody);
      
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, message);
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Webhook signature verified');
    } else {
      console.log('Webhook secret not configured, skipping signature verification');
    }

    // Step 2: Find the booking by SmartReno job ID
    const { data: booking, error: findError } = await supabase
      .from('service_bookings')
      .select('*')
      .eq('smartreno_job_id', payload.job_id)
      .single();

    if (findError || !booking) {
      console.error('Booking not found for job_id:', payload.job_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found booking:', booking.id);

    // Step 3: Update booking based on event type
    let newStatus: string;
    let newPaymentStatus: string;

    switch (payload.event) {
      case 'payment_completed':
        newStatus = 'paid';
        newPaymentStatus = 'completed';
        break;
      case 'payment_failed':
        newStatus = 'payment_failed';
        newPaymentStatus = 'failed';
        break;
      case 'payment_refunded':
        newStatus = 'refunded';
        newPaymentStatus = 'refunded';
        break;
      default:
        console.error('Unknown event type:', payload.event);
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown event type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const { error: updateError } = await supabase
      .from('service_bookings')
      .update({
        status: newStatus,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Booking updated:', { id: booking.id, status: newStatus, payment_status: newPaymentStatus });

    // Step 4: For successful payments, trigger crew dispatch notification
    if (payload.event === 'payment_completed') {
      console.log('Payment successful - triggering dispatch notification for booking:', booking.id);
      
      // Log the payment event for dispatch
      const { error: logError } = await supabase
        .from('automation_events')
        .insert({
          event_type: 'service_payment_completed',
          source_table: 'service_bookings',
          source_id: booking.id,
          action_taken: 'payment_confirmed_ready_for_dispatch',
          action_result: {
            booking_id: booking.id,
            service_type: booking.service_type,
            total_price: booking.total_price,
            customer_name: booking.customer_name,
            customer_phone: booking.customer_phone,
            service_address: booking.service_address,
            preferred_date: booking.preferred_date,
            amount_paid: payload.amount_paid,
            paid_at: payload.paid_at
          }
        });

      if (logError) {
        console.error('Error logging automation event:', logError);
        // Don't fail the webhook for logging errors
      }

      // TODO: Add SMS/email notification to crew here
      // Could call send-estimate-sms or similar function
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Booking ${booking.id} updated to ${newStatus}`,
        booking_id: booking.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in smartreno-payment-webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

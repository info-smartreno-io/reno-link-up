import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceOption {
  name: string;
  price: number;
}

interface BookingRequest {
  service_type: string;
  service_options: ServiceOption[];
  add_ons: ServiceOption[];
  total_price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  preferred_date?: string;
  preferred_time_slot?: string;
  access_notes?: string;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smartrenoApiUrl = Deno.env.get('SMARTRENO_API_URL');
    const smartrenoApiKey = Deno.env.get('SMARTRENO_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bookingData: BookingRequest = await req.json();

    console.log('Processing booking request:', {
      service_type: bookingData.service_type,
      customer_email: bookingData.customer_email,
      total_price: bookingData.total_price
    });

    // Validate required fields
    if (!bookingData.customer_name || !bookingData.customer_email || !bookingData.customer_phone) {
      console.error('Missing required customer fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required customer information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!bookingData.service_type || !bookingData.total_price) {
      console.error('Missing required service fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required service information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Create booking in our database
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .insert({
        service_type: bookingData.service_type,
        service_options: bookingData.service_options || [],
        add_ons: bookingData.add_ons || [],
        total_price: bookingData.total_price,
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        service_address: bookingData.service_address,
        city: bookingData.city,
        state: bookingData.state || 'NJ',
        zip_code: bookingData.zip_code,
        preferred_date: bookingData.preferred_date,
        preferred_time_slot: bookingData.preferred_time_slot,
        access_notes: bookingData.access_notes,
        source: bookingData.source || 'allinonehome.com',
        status: 'pending_payment',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Booking created successfully:', booking.id);

    // Step 2: Try SmartReno integration if API credentials are available
    let smartrenoHomeownerId: string | null = null;
    let smartrenoJobId: string | null = null;
    let smartrenoPaymentUrl: string | null = null;
    let integrationMode = 'waitlist'; // Default to waitlist mode

    if (smartrenoApiUrl && smartrenoApiKey) {
      console.log('SmartReno API configured, attempting integration...');
      
      try {
        // Step 2a: Create homeowner account in SmartReno
        const accountResponse = await fetch(`${smartrenoApiUrl}/functions/v1/create-homeowner-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${smartrenoApiKey}`
          },
          body: JSON.stringify({
            email: bookingData.customer_email,
            full_name: bookingData.customer_name,
            phone: bookingData.customer_phone,
            service_address: bookingData.service_address,
            source: bookingData.source || 'allinonehome.com'
          })
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          smartrenoHomeownerId = accountData.homeowner_id;
          console.log('SmartReno account created/retrieved:', smartrenoHomeownerId);

          // Step 2b: Create service job in SmartReno
          const jobResponse = await fetch(`${smartrenoApiUrl}/functions/v1/create-service-job`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${smartrenoApiKey}`
            },
            body: JSON.stringify({
              homeowner_id: smartrenoHomeownerId,
              service_type: bookingData.service_type,
              service_options: bookingData.service_options,
              add_ons: bookingData.add_ons,
              total_price: bookingData.total_price,
              service_address: bookingData.service_address,
              preferred_date: bookingData.preferred_date,
              access_notes: bookingData.access_notes,
              payment_status: 'pending',
              source: bookingData.source || 'allinonehome.com'
            })
          });

          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            smartrenoJobId = jobData.job_id;
            smartrenoPaymentUrl = jobData.payment_url;
            integrationMode = 'smartreno';
            console.log('SmartReno job created:', smartrenoJobId);
          } else {
            console.error('Failed to create SmartReno job:', await jobResponse.text());
          }
        } else {
          console.error('Failed to create SmartReno account:', await accountResponse.text());
        }
      } catch (smartrenoError) {
        console.error('SmartReno integration error:', smartrenoError);
        // Continue with local booking only
      }
    } else {
      console.log('SmartReno API not configured, operating in waitlist mode');
    }

    // Step 3: Update booking with SmartReno IDs if available
    if (smartrenoHomeownerId || smartrenoJobId) {
      const { error: updateError } = await supabase
        .from('service_bookings')
        .update({
          smartreno_homeowner_id: smartrenoHomeownerId,
          smartreno_job_id: smartrenoJobId,
          smartreno_payment_url: smartrenoPaymentUrl
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Error updating booking with SmartReno IDs:', updateError);
      }
    }

    // Return success response
    const response = {
      success: true,
      booking_id: booking.id,
      integration_mode: integrationMode,
      payment_url: smartrenoPaymentUrl,
      message: integrationMode === 'smartreno' 
        ? 'Booking created. Redirecting to payment...'
        : 'Booking received! We\'ll contact you shortly to schedule your service.'
    };

    console.log('Booking completed:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in create-smartreno-booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

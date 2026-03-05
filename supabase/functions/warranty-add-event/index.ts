import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { claim_id, event_type, message, metadata } = await req.json();

    console.log('Adding warranty claim event:', claim_id, event_type);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('warranty_claim_events')
      .insert({
        claim_id,
        actor_id: user?.id,
        actor_role: 'admin',
        event_type,
        message,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // If it's an inspection or repair scheduled event, update next_action
    if (event_type === 'inspection_scheduled' || event_type === 'repair_scheduled') {
      await supabase
        .from('warranty_claims')
        .update({
          next_action: message,
          next_action_due_at: metadata?.scheduled_date || null,
        })
        .eq('id', claim_id);
    }

    console.log('Warranty claim event added successfully');

    return new Response(
      JSON.stringify({ event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error adding warranty claim event:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

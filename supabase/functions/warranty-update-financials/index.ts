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

    const {
      claim_id,
      estimated_repair_cost,
      approved_repair_cost,
      contractor_share,
      smartreno_share,
      vendor_share,
      notes,
    } = await req.json();

    console.log('Updating warranty claim financials:', claim_id);

    // Check if financials record exists
    const { data: existing } = await supabase
      .from('warranty_claim_financials')
      .select('id')
      .eq('claim_id', claim_id)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('warranty_claim_financials')
        .update({
          estimated_repair_cost,
          approved_repair_cost,
          contractor_share,
          smartreno_share,
          vendor_share,
          notes,
        })
        .eq('claim_id', claim_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('warranty_claim_financials')
        .insert({
          claim_id,
          estimated_repair_cost,
          approved_repair_cost,
          contractor_share,
          smartreno_share,
          vendor_share,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log event
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('warranty_claim_events')
      .insert({
        claim_id,
        actor_id: user?.id,
        actor_role: 'admin',
        event_type: 'financials_updated',
        message: 'Financial details updated',
      });

    console.log('Warranty claim financials updated successfully');

    return new Response(
      JSON.stringify({ financials: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating warranty claim financials:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

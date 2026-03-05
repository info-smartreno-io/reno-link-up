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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { permitId, status, permitNumber } = await req.json();

    console.log('Updating permit status:', permitId, status);

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (permitNumber) {
      updateData.permit_number = permitNumber;
    }

    // Set timestamps based on status
    if (status === 'submitted' && !updateData.applied_at) {
      updateData.applied_at = new Date().toISOString();
    }

    if (status === 'approved' && !updateData.approved_at) {
      updateData.approved_at = new Date().toISOString();
    }

    if (status === 'closed' && !updateData.closed_at) {
      updateData.closed_at = new Date().toISOString();
    }

    const { data: permit, error: permitError } = await supabase
      .from('permits')
      .update(updateData)
      .eq('id', permitId)
      .select()
      .single();

    if (permitError) {
      console.error('Error updating permit:', permitError);
      return new Response(JSON.stringify({ error: permitError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully updated permit status');

    // TODO: Send notifications to homeowner if approved

    return new Response(JSON.stringify({ permit }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
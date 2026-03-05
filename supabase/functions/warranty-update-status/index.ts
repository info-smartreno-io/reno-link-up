import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validStatusTransitions: Record<string, string[]> = {
  'new': ['in_review', 'info_requested', 'denied'],
  'in_review': ['info_requested', 'scheduled_inspection', 'denied', 'awaiting_contractor'],
  'info_requested': ['in_review', 'scheduled_inspection'],
  'scheduled_inspection': ['awaiting_contractor', 'in_review'],
  'awaiting_contractor': ['in_repair', 'denied'],
  'in_repair': ['resolved'],
  'resolved': ['closed'],
  'denied': ['closed'],
  'closed': [],
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

    const { claim_id, to_status, message } = await req.json();

    console.log('Updating warranty claim status:', claim_id, 'to', to_status);

    // Get current claim
    const { data: claim, error: claimError } = await supabase
      .from('warranty_claims')
      .select('*')
      .eq('id', claim_id)
      .single();

    if (claimError) throw claimError;

    const from_status = claim.claim_status;

    // Validate transition
    if (!validStatusTransitions[from_status]?.includes(to_status)) {
      throw new Error(`Invalid status transition from ${from_status} to ${to_status}`);
    }

    // Update claim
    const updateData: any = { claim_status: to_status };
    
    if (to_status === 'resolved' || to_status === 'denied') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('warranty_claims')
      .update(updateData)
      .eq('id', claim_id);

    if (updateError) throw updateError;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create event
    await supabase
      .from('warranty_claim_events')
      .insert({
        claim_id,
        actor_id: user?.id,
        actor_role: 'admin',
        event_type: 'status_change',
        from_status,
        to_status,
        message: message || `Status changed from ${from_status} to ${to_status}`,
      });

    // Send email notification to homeowner
    try {
      console.log('Triggering email notification for warranty claim status change');
      await supabase.functions.invoke('send-warranty-claim-notification', {
        body: {
          claim_id,
          new_status: to_status,
          old_status: from_status,
        },
      });
    } catch (notificationError) {
      console.error('Failed to send notification, but status was updated:', notificationError);
      // Don't fail the status update if notification fails
    }

    console.log('Warranty claim status updated successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating warranty claim status:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

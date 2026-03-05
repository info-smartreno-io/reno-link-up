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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the Authorization header
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { role, maxUses = 1 } = await req.json();

    // Generate a unique invitation token
    const token = crypto.randomUUID();

    // Create the invitation
    const { data: invitation, error } = await supabaseClient
      .from('contractor_team_invitations')
      .insert({
        contractor_id: user.id,
        invitation_token: token,
        role: role,
        max_uses: maxUses,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate the full invitation URL
    const invitationUrl = `${req.headers.get('origin')}/contractor/team/join?token=${token}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        invitation,
        invitationUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-team-invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

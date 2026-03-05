import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { securityLogger } from '../_shared/securityLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OAuthCallbackSchema = z.object({
  code: z.string().trim().min(1).max(1000),
  realmId: z.string().trim().min(1).max(100),
  state: z.string().uuid().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    let validatedParams;
    try {
      validatedParams = OAuthCallbackSchema.parse({
        code: url.searchParams.get('code'),
        realmId: url.searchParams.get('realmId'),
        state: url.searchParams.get('state') || undefined,
      });
    } catch (validationError) {
      await securityLogger.logValidationError(
        req,
        'quickbooks-oauth-callback',
        validationError
      );
      throw new Error('Invalid OAuth callback parameters');
    }
    
    const { code, realmId, state } = validatedParams;

    // Get QuickBooks credentials from environment
    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    const redirectUri = Deno.env.get('QUICKBOOKS_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('QuickBooks credentials not configured');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Get user ID from state (passed during auth initiation)
    const userId = state;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if token already exists for this user
    const { data: existingToken } = await supabase
      .from('quickbooks_tokens')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('quickbooks_tokens')
        .update({
          realm_id: realmId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      // Insert new token
      const { error: insertError } = await supabase
        .from('quickbooks_tokens')
        .insert({
          user_id: userId,
          realm_id: realmId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) throw insertError;
    }

    // Redirect back to the QuickBooks page with success
    const redirectUrl = `${url.origin}/admin/quickbooks?connected=true`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('QuickBooks OAuth error:', error);
    
    await securityLogger.logEdgeFunctionError(
      req,
      'quickbooks-oauth-callback',
      error instanceof Error ? error : new Error('Unknown error')
    );
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

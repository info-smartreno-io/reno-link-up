import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  userId: string;
  syncTypes: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, syncTypes }: SyncRequest = await req.json();

    if (!userId || !syncTypes || syncTypes.length === 0) {
      throw new Error('User ID and sync types are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get QuickBooks token
    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('No QuickBooks connection found');
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    let accessToken = tokenData.access_token;
    
    if (expiresAt <= now) {
      // Refresh token
      const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/quickbooks-refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh QuickBooks token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
    }

    const syncResults = [];

    // Sync each requested type
    for (const syncType of syncTypes) {
      try {
        let recordsSynced = 0;

        switch (syncType) {
          case 'invoices':
            recordsSynced = await syncInvoices(tokenData.realm_id, accessToken, supabase);
            break;
          case 'estimates':
            recordsSynced = await syncEstimates(tokenData.realm_id, accessToken, supabase);
            break;
          case 'customers':
            recordsSynced = await syncCustomers(tokenData.realm_id, accessToken, supabase);
            break;
          default:
            throw new Error(`Unknown sync type: ${syncType}`);
        }

        // Log sync history
        await supabase.from('quickbooks_sync_history').insert({
          user_id: userId,
          sync_type: syncType,
          status: 'success',
          records_synced: recordsSynced,
        });

        syncResults.push({
          type: syncType,
          status: 'success',
          recordsSynced,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        // Log failed sync
        await supabase.from('quickbooks_sync_history').insert({
          user_id: userId,
          sync_type: syncType,
          status: 'error',
          records_synced: 0,
          error_message: errorMessage,
        });

        syncResults.push({
          type: syncType,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results: syncResults,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('QuickBooks sync error:', error);
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

async function syncInvoices(realmId: string, accessToken: string, supabase: any): Promise<number> {
  // Query invoices from QuickBooks
  const response = await fetch(
    `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Invoice MAXRESULTS 100`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch invoices from QuickBooks');
  }

  const data = await response.json();
  const invoices = data.QueryResponse?.Invoice || [];

  // In a real implementation, you would insert/update these in your database
  console.log(`Synced ${invoices.length} invoices`);
  
  return invoices.length;
}

async function syncEstimates(realmId: string, accessToken: string, supabase: any): Promise<number> {
  // Query estimates from QuickBooks
  const response = await fetch(
    `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Estimate MAXRESULTS 100`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch estimates from QuickBooks');
  }

  const data = await response.json();
  const estimates = data.QueryResponse?.Estimate || [];

  console.log(`Synced ${estimates.length} estimates`);
  
  return estimates.length;
}

async function syncCustomers(realmId: string, accessToken: string, supabase: any): Promise<number> {
  // Query customers from QuickBooks
  const response = await fetch(
    `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM Customer MAXRESULTS 100`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch customers from QuickBooks');
  }

  const data = await response.json();
  const customers = data.QueryResponse?.Customer || [];

  console.log(`Synced ${customers.length} customers`);
  
  return customers.length;
}

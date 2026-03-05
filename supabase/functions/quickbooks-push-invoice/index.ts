import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushInvoiceRequest {
  invoiceId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invoiceId }: PushInvoiceRequest = await req.json();

    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Get QuickBooks token for the user
    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    if (tokenError || !tokenData) {
      console.log('No QuickBooks connection found for user, skipping sync');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No QuickBooks connection configured',
          synced: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        body: JSON.stringify({ userId: invoice.user_id }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh QuickBooks token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
    }

    // Find or create customer in QuickBooks
    let customerId = null;
    const customerName = invoice.client_name || invoice.homeowner_name || 'Customer';
    const customerEmail = invoice.client_email || invoice.homeowner_email || '';
    
    // Search for existing customer
    const searchResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/query?query=SELECT * FROM Customer WHERE DisplayName = '${customerName}' MAXRESULTS 1`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const customers = searchData.QueryResponse?.Customer || [];
      if (customers.length > 0) {
        customerId = customers[0].Id;
      }
    }

    // Create customer if not found
    if (!customerId) {
      const createCustomerResponse = await fetch(
        `https://quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/customer`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            DisplayName: customerName,
            PrimaryEmailAddr: {
              Address: customerEmail,
            },
          }),
        }
      );

      if (!createCustomerResponse.ok) {
        const errorText = await createCustomerResponse.text();
        console.error('Failed to create customer in QuickBooks:', errorText);
        throw new Error('Failed to create customer in QuickBooks');
      }

      const customerData = await createCustomerResponse.json();
      customerId = customerData.Customer.Id;
    }

    // Prepare line items for QuickBooks
    const lineItems = (invoice.line_items || []).map((item: any, index: number) => ({
      DetailType: "SalesItemLineDetail",
      Amount: Number(item.amount),
      SalesItemLineDetail: {
        Qty: item.quantity,
        UnitPrice: Number(item.rate),
      },
      Description: item.description,
      LineNum: index + 1,
    }));

    // Add tax line if applicable
    if (Number(invoice.tax_amount) > 0) {
      lineItems.push({
        DetailType: "SalesItemLineDetail",
        Amount: Number(invoice.tax_amount),
        Description: `Tax (${Number(invoice.tax_rate)}%)`,
        LineNum: lineItems.length + 1,
      });
    }

    // Create invoice in QuickBooks
    const qbInvoiceData = {
      CustomerRef: {
        value: customerId,
      },
      Line: lineItems,
      TxnDate: invoice.invoice_date,
      DueDate: invoice.due_date,
      DocNumber: invoice.invoice_number,
      CustomerMemo: {
        value: invoice.notes || '',
      },
      PrivateNote: `Synced from SmartReno - Invoice ID: ${invoice.id}`,
    };

    const createInvoiceResponse = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${tokenData.realm_id}/invoice`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(qbInvoiceData),
      }
    );

    if (!createInvoiceResponse.ok) {
      const errorText = await createInvoiceResponse.text();
      console.error('Failed to create invoice in QuickBooks:', errorText);
      throw new Error('Failed to create invoice in QuickBooks');
    }

    const qbInvoice = await createInvoiceResponse.json();

    // Update invoice with QuickBooks ID
    await supabase
      .from('invoices')
      .update({ quickbooks_id: qbInvoice.Invoice.Id })
      .eq('id', invoice.id);

    console.log('Successfully synced invoice to QuickBooks:', qbInvoice.Invoice.Id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invoice synced to QuickBooks',
        synced: true,
        quickbooksId: qbInvoice.Invoice.Id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('QuickBooks invoice sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        synced: false,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

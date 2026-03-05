import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-portal-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const portalToken = req.headers.get('x-portal-token');
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (!portalToken) {
      return new Response(
        JSON.stringify({ error: 'Portal access token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token and check project access
    const { data: access, error: accessError } = await supabase
      .from('homeowner_portal_access')
      .select('*')
      .eq('access_token', portalToken)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (accessError || !access) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get project documents
    const { data: projectDocs } = await supabase
      .from('contractor_project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    // Get contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, contract_number, signature_status, signed_at, contract_value, created_at')
      .eq('project_id', projectId);

    // Get permits
    const { data: permits } = await supabase
      .from('permits')
      .select('id, permit_type, permit_number, status, applied_at, approved_at')
      .eq('project_id', projectId);

    // Get invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, due_date, paid_at')
      .eq('project_id', projectId);

    // Get change orders
    const { data: changeOrders } = await supabase
      .from('change_orders')
      .select('id, change_order_number, description, change_amount, status, created_at')
      .eq('project_id', projectId);

    // Format documents by category
    const documents: any[] = [];

    // Add project documents
    if (projectDocs) {
      projectDocs.forEach(doc => {
        documents.push({
          id: doc.id,
          name: doc.document_name,
          type: doc.document_type,
          category: 'project_document',
          url: doc.file_path,
          file_size: doc.file_size,
          uploaded_at: doc.uploaded_at,
        });
      });
    }

    // Add contracts
    if (contracts) {
      contracts.forEach(contract => {
        documents.push({
          id: contract.id,
          name: `Contract ${contract.contract_number}`,
          type: 'contract',
          category: 'contract',
          status: contract.signature_status,
          value: contract.contract_value,
          signed_at: contract.signed_at,
          uploaded_at: contract.created_at,
        });
      });
    }

    // Add permits
    if (permits) {
      permits.forEach(permit => {
        documents.push({
          id: permit.id,
          name: `${permit.permit_type} Permit ${permit.permit_number || ''}`.trim(),
          type: 'permit',
          category: 'permit',
          status: permit.status,
          applied_at: permit.applied_at,
          approved_at: permit.approved_at,
          uploaded_at: permit.applied_at,
        });
      });
    }

    // Add invoices
    if (invoices) {
      invoices.forEach(invoice => {
        documents.push({
          id: invoice.id,
          name: `Invoice ${invoice.invoice_number}`,
          type: 'invoice',
          category: 'financial',
          amount: invoice.amount,
          status: invoice.status,
          due_date: invoice.due_date,
          paid_at: invoice.paid_at,
          uploaded_at: invoice.due_date,
        });
      });
    }

    // Add change orders
    if (changeOrders) {
      changeOrders.forEach(co => {
        documents.push({
          id: co.id,
          name: `Change Order ${co.change_order_number}`,
          type: 'change_order',
          category: 'financial',
          description: co.description,
          amount: co.change_amount,
          status: co.status,
          uploaded_at: co.created_at,
        });
      });
    }

    // Sort by date
    documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

    console.log(`Returning ${documents.length} documents for project: ${projectId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        total_count: documents.length,
        documents,
        summary: {
          contracts: contracts?.length || 0,
          permits: permits?.length || 0,
          invoices: invoices?.length || 0,
          change_orders: changeOrders?.length || 0,
          other_documents: projectDocs?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Customer portal documents error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

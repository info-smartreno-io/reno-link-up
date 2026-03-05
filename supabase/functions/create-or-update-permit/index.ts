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

    const { projectId, jurisdictionState, municipality, scopeTags, requiresPermit } = await req.json();

    console.log('Creating/updating permit for project:', projectId);

    // Upsert permit
    const { data: permit, error: permitError } = await supabase
      .from('permits')
      .upsert({
        project_id: projectId,
        jurisdiction_state: jurisdictionState,
        jurisdiction_municipality: municipality,
        requires_permit: requiresPermit,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id',
      })
      .select()
      .single();

    if (permitError) {
      console.error('Error upserting permit:', permitError);
      return new Response(JSON.stringify({ error: permitError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get matching rules
    const { data: rules, error: rulesError } = await supabase
      .from('permit_form_rules')
      .select('*')
      .eq('state', jurisdictionState)
      .eq('active', true);

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      return new Response(JSON.stringify({ error: rulesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute required forms
    const requiredFormCodes = new Set<string>();
    const formMetadata: Record<string, any> = {};

    // Always add zoning and base application
    requiredFormCodes.add('ZONING_LOCAL');
    requiredFormCodes.add('UCC-F100');

    formMetadata['ZONING_LOCAL'] = {
      name: 'Zoning Application',
      authority: 'MUNICIPAL',
    };
    formMetadata['UCC-F100'] = {
      name: 'Construction Permit Application',
      authority: 'NJ_DCA',
    };

    // Process rules
    for (const rule of rules || []) {
      // Check if municipality matches (null means statewide)
      if (rule.municipality && rule.municipality !== municipality) {
        continue;
      }

      // Check if any scope tags match
      const hasMatchingScope = rule.scope_tags.some((tag: string) => 
        scopeTags.includes(tag)
      );

      if (hasMatchingScope) {
        rule.required_form_codes.forEach((code: string) => requiredFormCodes.add(code));
      }
    }

    // Map form codes to metadata
    const formCodeMap: Record<string, { name: string; authority: string }> = {
      'UCC-F110': { name: 'Building Subcode Technical Section', authority: 'NJ_DCA' },
      'UCC-F120': { name: 'Electrical Subcode Technical Section', authority: 'NJ_DCA' },
      'UCC-F130': { name: 'Plumbing Subcode Technical Section', authority: 'NJ_DCA' },
      'UCC-F140': { name: 'Fire Protection Subcode Technical Section', authority: 'NJ_DCA' },
      'UCC-F145': { name: 'Mechanical Subcode Technical Section', authority: 'NJ_DCA' },
    };

    // Upsert required forms
    const formsToInsert = Array.from(requiredFormCodes).map(code => ({
      permit_id: permit.id,
      form_code: code,
      form_name: formMetadata[code]?.name || formCodeMap[code]?.name || code,
      authority: formMetadata[code]?.authority || formCodeMap[code]?.authority || 'NJ_DCA',
      is_required: true,
      status: 'not_started',
    }));

    // Delete existing forms and insert new ones
    await supabase
      .from('permit_required_forms')
      .delete()
      .eq('permit_id', permit.id);

    const { data: forms, error: formsError } = await supabase
      .from('permit_required_forms')
      .insert(formsToInsert)
      .select();

    if (formsError) {
      console.error('Error inserting forms:', formsError);
      return new Response(JSON.stringify({ error: formsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully created/updated permit with', forms?.length, 'forms');

    return new Response(JSON.stringify({ permit, forms }), {
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
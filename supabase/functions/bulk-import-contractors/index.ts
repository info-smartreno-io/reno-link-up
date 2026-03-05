import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

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

    const { contractors, source = 'manual', importedBy } = await req.json();

    if (!contractors || !Array.isArray(contractors) || contractors.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No contractors data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('bulk_contractor_imports')
      .insert({
        source,
        total_records: contractors.length,
        processed_records: 0,
        successful_imports: 0,
        failed_imports: 0,
        status: 'processing',
        import_data: { contractors },
        created_by: importedBy,
      })
      .select()
      .single();

    if (importError) throw importError;

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each contractor
    for (const contractor of contractors) {
      try {
        // Validate required fields
        if (!contractor.contractor_name || !contractor.email) {
          results.failed++;
          results.errors.push(`Missing required fields for: ${contractor.contractor_name || 'Unknown'}`);
          continue;
        }

        // Calculate quality score
        let qualityScore = 50;
        if (contractor.license_number) qualityScore += 10;
        if (contractor.insurance_verified) qualityScore += 10;
        if (contractor.review_count > 10) qualityScore += 15;
        if (contractor.average_rating >= 4.5) qualityScore += 15;

        // Insert contractor lead
        const { error: insertError } = await supabase
          .from('contractor_leads')
          .insert({
            contractor_name: contractor.contractor_name,
            contact_name: contractor.contact_name,
            email: contractor.email.toLowerCase().trim(),
            phone: contractor.phone,
            service_areas: contractor.service_areas || [],
            specialties: contractor.specialties || [],
            license_number: contractor.license_number,
            insurance_verified: contractor.insurance_verified || false,
            average_rating: contractor.average_rating,
            review_count: contractor.review_count,
            scraped_source: contractor.source || source,
            scrape_data: contractor,
            quality_score: qualityScore,
            outreach_status: 'new',
            referral_source: contractor.referral_source,
            seo_ranking_page: contractor.seo_ranking_page,
          } as any);

        if (insertError) {
          if (insertError.code === '23505') {
            // Duplicate entry
            results.errors.push(`Duplicate contractor: ${contractor.email}`);
          } else {
            results.errors.push(`Error importing ${contractor.contractor_name}: ${insertError.message}`);
          }
          results.failed++;
        } else {
          results.successful++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Exception for ${contractor.contractor_name}: ${error.message}`);
      }
    }

    // Update import record
    await supabase
      .from('bulk_contractor_imports')
      .update({
        processed_records: contractors.length,
        successful_imports: results.successful,
        failed_imports: results.failed,
        status: 'completed',
        error_log: results.errors,
        completed_at: new Date().toISOString(),
      } as any)
      .eq('id', importRecord.id);

    return new Response(
      JSON.stringify({
        import_id: importRecord.id,
        total: contractors.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

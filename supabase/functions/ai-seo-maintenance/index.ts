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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all published pages
    const { data: pages, error: pagesError } = await supabase
      .from('seo_pages')
      .select('*')
      .eq('published', true);

    if (pagesError) {
      throw pagesError;
    }

    const recommendations = [];

    // Analyze each page
    for (const page of pages || []) {
      // Check if content needs refresh (older than 30 days)
      const lastRefresh = page.last_ai_refresh ? new Date(page.last_ai_refresh) : new Date(page.created_at);
      const daysSinceRefresh = Math.floor((Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceRefresh > 30) {
        recommendations.push({
          page_id: page.id,
          page_path: page.slug,
          issue: 'Content age',
          recommendation: 'Refresh content - over 30 days old',
          priority: 'medium',
          automated_action: 'content_refresh',
        });
      }

      // Check if page has low engagement (example heuristic)
      if (page.monthly_views < 50 && page.published_at) {
        const monthsSincePublish = Math.floor(
          (Date.now() - new Date(page.published_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (monthsSincePublish > 3) {
          recommendations.push({
            page_id: page.id,
            page_path: page.slug,
            issue: 'Low traffic',
            recommendation: 'Optimize title and meta description, add more long-tail keywords',
            priority: 'high',
            automated_action: 'seo_optimization',
          });
        }
      }

      // Check if page has low conversions
      const conversionRate = page.monthly_views > 0 
        ? (page.monthly_conversions / page.monthly_views) * 100
        : 0;

      if (conversionRate < 2 && page.monthly_views > 100) {
        recommendations.push({
          page_id: page.id,
          page_path: page.slug,
          issue: 'Low conversion rate',
          recommendation: 'Improve CTAs and trust signals',
          priority: 'high',
          automated_action: 'cta_optimization',
        });
      }

      // Check for missing internal links
      const internalLinks = page.internal_links || [];
      if (internalLinks.length < 3) {
        recommendations.push({
          page_id: page.id,
          page_path: page.slug,
          issue: 'Few internal links',
          recommendation: 'Add more internal links to related pages',
          priority: 'low',
          automated_action: 'add_internal_links',
        });
      }
    }

    // Mark pages that need refresh
    const pagesToRefresh = recommendations
      .filter(r => r.automated_action === 'content_refresh')
      .map(r => r.page_id);

    if (pagesToRefresh.length > 0) {
      await supabase
        .from('seo_pages')
        .update({ needs_refresh: true })
        .in('id', pagesToRefresh);
    }

    // Create maintenance report
    const { data: report, error: reportError } = await supabase
      .from('seo_content_updates')
      .insert({
        page_path: '/maintenance-scan',
        page_type: 'system',
        update_type: 'automated_scan',
        update_summary: `Scanned ${pages?.length || 0} pages, found ${recommendations.length} recommendations`,
        changes_made: {
          pages_scanned: pages?.length || 0,
          recommendations: recommendations.length,
          content_refreshes_needed: pagesToRefresh.length,
        },
        ai_confidence_score: 95,
        status: 'applied',
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        pages_scanned: pages?.length || 0,
        recommendations: recommendations.length,
        pages_needing_refresh: pagesToRefresh.length,
        report_id: report?.id,
        top_issues: recommendations.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-seo-maintenance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

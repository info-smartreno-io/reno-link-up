import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageAnalysis {
  path: string;
  type: string;
  title?: string;
  description?: string;
  h1?: string;
  wordCount?: number;
  hasStructuredData?: boolean;
}

interface SEORecommendation {
  page_path: string;
  page_type: string;
  recommendation_type: string;
  priority: string;
  current_value?: string;
  suggested_value: string;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a new report
    const { data: report, error: reportError } = await supabase
      .from('ai_seo_reports')
      .insert({
        report_type: 'weekly_refresh',
        status: 'running'
      })
      .select()
      .single();

    if (reportError) throw reportError;

    console.log('Created SEO report:', report.id);

    // Define pages to analyze (in production, this would crawl the sitemap)
    const pagesToAnalyze: PageAnalysis[] = [
      { path: '/', type: 'home' },
      { path: '/services', type: 'service_index' },
      { path: '/locations/bergen', type: 'county_page' },
      { path: '/locations/passaic', type: 'county_page' },
      { path: '/calculators', type: 'calculator' },
      { path: '/cost-guides', type: 'cost_guide' },
    ];

    const allRecommendations: SEORecommendation[] = [];

    // Analyze each page with AI
    for (const page of pagesToAnalyze) {
      console.log(`Analyzing ${page.path}...`);

      const prompt = `You are an SEO expert analyzing a SmartReno renovation website page.

Page: ${page.path}
Type: ${page.type}

SmartReno is a Northern New Jersey renovation platform that connects homeowners with vetted contractors.

Analyze this page and provide 3-5 specific, actionable SEO recommendations focused on:
1. Meta title optimization (include location + service keywords)
2. Meta description improvements (compelling, under 160 chars)
3. Internal linking opportunities (link to related services, locations, calculators)
4. Content gaps (missing sections, thin content)
5. Structured data needs (JSON-LD schemas)

For each recommendation, provide:
- type: (meta_title|meta_description|internal_link|content_gap|structured_data)
- priority: (high|medium|low)
- current: what exists now (if applicable)
- suggested: specific improvement
- reasoning: why this helps SEO

Return as JSON array of recommendations.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an SEO expert. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`AI API error for ${page.path}:`, aiResponse.status, errorText);
        continue;
      }

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content;

      if (!aiContent) {
        console.error(`No AI content for ${page.path}`);
        continue;
      }

      // Parse AI recommendations
      try {
        const recommendations = JSON.parse(aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
        
        if (Array.isArray(recommendations)) {
          for (const rec of recommendations) {
            allRecommendations.push({
              page_path: page.path,
              page_type: page.type,
              recommendation_type: rec.type || 'general',
              priority: rec.priority || 'medium',
              current_value: rec.current || null,
              suggested_value: rec.suggested || '',
              reasoning: rec.reasoning || ''
            });
          }
        }
      } catch (parseError) {
        console.error(`Failed to parse AI response for ${page.path}:`, parseError);
        console.log('AI response:', aiContent);
      }
    }

    // Insert recommendations
    if (allRecommendations.length > 0) {
      const { error: recError } = await supabase
        .from('ai_seo_recommendations')
        .insert(
          allRecommendations.map(rec => ({
            ...rec,
            report_id: report.id,
            status: 'pending'
          }))
        );

      if (recError) {
        console.error('Error inserting recommendations:', recError);
      }
    }

    // Update report status
    await supabase
      .from('ai_seo_reports')
      .update({
        status: 'completed',
        pages_analyzed: pagesToAnalyze.length,
        recommendations_count: allRecommendations.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', report.id);

    console.log(`SEO refresh complete: ${allRecommendations.length} recommendations for ${pagesToAnalyze.length} pages`);

    return new Response(
      JSON.stringify({
        success: true,
        report_id: report.id,
        pages_analyzed: pagesToAnalyze.length,
        recommendations: allRecommendations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-seo-refresh:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

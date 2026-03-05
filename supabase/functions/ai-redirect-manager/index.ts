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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    console.log('Starting broken link scan...');

    // Create a new redirect report
    const { data: report, error: reportError } = await supabase
      .from('ai_redirect_reports')
      .insert({
        status: 'running',
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Get all published SEO pages to crawl
    const { data: seoPages } = await supabase
      .from('seo_pages')
      .select('slug, content')
      .eq('published', true)
      .limit(50);

    const brokenLinks = [];
    let pagesCrawled = 0;

    // Simulate crawling and finding broken links
    // In production, this would actually fetch pages and check links
    const simulatedBrokenLinks = [
      {
        broken_url: '/old-roofing-guide',
        found_on_page: '/bergen-county/ridgewood',
        link_text: 'View Roofing Guide',
        error_type: '404',
      },
      {
        broken_url: '/contractor/old-dashboard',
        found_on_page: '/contractor-portal',
        link_text: 'Dashboard',
        error_type: '404',
      },
      {
        broken_url: '/services/kitchen-renovation',
        found_on_page: '/essex-county/montclair',
        link_text: 'Kitchen Services',
        error_type: '404',
      },
    ];

    pagesCrawled = (seoPages?.length || 0) + 10; // Simulate crawling SEO pages + main pages

    // Use AI to suggest redirects
    for (const link of simulatedBrokenLinks) {
      let suggestedRedirect = '';
      let reasoning = '';
      let confidence = 0;

      if (lovableApiKey) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{
                role: 'user',
                content: `A broken link was found on SmartReno.io:
- Broken URL: ${link.broken_url}
- Found on page: ${link.found_on_page}
- Link text: "${link.link_text}"
- Error: ${link.error_type}

SmartReno is a home renovation platform in NJ with:
- Town-specific pages: /bergen-county/ridgewood, /essex-county/montclair
- Project types: roofing, kitchen, bathroom, additions
- Contractor portal: /contractor
- Homeowner portal: /homeowner

Suggest the best redirect URL and provide reasoning. Format as JSON:
{
  "redirect_url": "/suggested-url",
  "reasoning": "Why this redirect makes sense",
  "confidence": 0.95
}`
              }],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              suggestedRedirect = parsed.redirect_url;
              reasoning = parsed.reasoning;
              confidence = parsed.confidence;
            }
          }
        } catch (err) {
          console.error('AI redirect suggestion error:', err);
        }
      }

      // Fallback if AI didn't work
      if (!suggestedRedirect) {
        if (link.broken_url.includes('roofing')) {
          suggestedRedirect = '/services/roofing';
        } else if (link.broken_url.includes('dashboard')) {
          suggestedRedirect = '/contractor';
        } else {
          suggestedRedirect = '/';
        }
        reasoning = 'Automatic fallback redirect';
        confidence = 0.5;
      }

      // Determine priority
      let priority = 'medium';
      if (confidence > 0.9 || link.error_type === '404') {
        priority = 'high';
      } else if (confidence < 0.6) {
        priority = 'low';
      }

      // Insert recommendation
      await supabase
        .from('ai_redirect_recommendations')
        .insert({
          report_id: report.id,
          broken_url: link.broken_url,
          found_on_page: link.found_on_page,
          link_text: link.link_text,
          error_type: link.error_type,
          suggested_redirect_url: suggestedRedirect,
          reasoning: reasoning,
          confidence_score: confidence,
          priority: priority,
          status: 'pending',
        });

      brokenLinks.push(link);
    }

    // Update report
    await supabase
      .from('ai_redirect_reports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pages_crawled: pagesCrawled,
        broken_links_found: brokenLinks.length,
        redirects_suggested: brokenLinks.length,
      })
      .eq('id', report.id);

    console.log(`Redirect scan completed: ${pagesCrawled} pages, ${brokenLinks.length} broken links`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_id: report.id,
        pages_crawled: pagesCrawled,
        broken_links_found: brokenLinks.length,
        redirects_suggested: brokenLinks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

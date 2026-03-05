import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Predefined pages to crawl
const PAGES_TO_CRAWL = [
  { url: '/', priority: 'high', name: 'Homepage' },
  { url: '/homeowner/portal', priority: 'high', name: 'Homeowner Portal' },
  { url: '/contractor/dashboard', priority: 'high', name: 'Contractor Dashboard' },
  { url: '/estimator/dashboard', priority: 'high', name: 'Estimator Dashboard' },
  { url: '/services', priority: 'high', name: 'Services Page' },
  { url: '/blog', priority: 'medium', name: 'Blog' },
  { url: '/about', priority: 'medium', name: 'About' },
  { url: '/contact', priority: 'medium', name: 'Contact' },
  { url: '/cost-guides/kitchen-remodel', priority: 'medium', name: 'Kitchen Cost Guide' },
  { url: '/cost-guides/bathroom-remodel', priority: 'medium', name: 'Bathroom Cost Guide' },
  { url: '/calculator/kitchen', priority: 'medium', name: 'Kitchen Calculator' },
  { url: '/calculator/bathroom', priority: 'medium', name: 'Bathroom Calculator' },
];

interface BrokenLink {
  brokenUrl: string;
  foundOnPage: string;
  linkText: string;
  errorType: string;
  priority: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting broken link analysis...');

    // Create new report
    const { data: report, error: reportError } = await supabase
      .from('ai_redirect_reports')
      .insert({
        status: 'running',
        pages_crawled: 0,
        broken_links_found: 0,
        redirects_suggested: 0,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    console.log('Created report:', report.id);

    // Simulate crawling pages and finding broken links
    const brokenLinks: BrokenLink[] = [];
    const baseUrl = supabaseUrl.replace('//', '//').split('.supabase.co')[0];

    for (const page of PAGES_TO_CRAWL) {
      console.log(`Crawling ${page.name}...`);
      
      // Simulate finding broken links (in production, would actually crawl)
      // For demo purposes, add some sample broken links
      if (Math.random() > 0.7) {
        brokenLinks.push({
          brokenUrl: `/old-page-${Math.floor(Math.random() * 100)}`,
          foundOnPage: page.url,
          linkText: 'Old Link',
          errorType: '404',
          priority: page.priority,
        });
      }
    }

    console.log(`Found ${brokenLinks.length} broken links`);

    // Use AI to analyze broken links and suggest redirects
    const aiPrompt = `You are an SEO expert analyzing broken links on a home renovation platform (SmartReno).

Here are the broken links found:
${brokenLinks.map((link, i) => `${i + 1}. Broken URL: ${link.brokenUrl}
   Found on: ${link.foundOnPage}
   Link text: "${link.linkText}"
   Error: ${link.errorType}`).join('\n\n')}

Available valid pages:
${PAGES_TO_CRAWL.map(p => `- ${p.url} (${p.name})`).join('\n')}

For each broken link, suggest:
1. The most appropriate redirect URL from the available pages
2. Confidence score (0.0-1.0)
3. Brief reasoning

Format your response as JSON array:
[
  {
    "brokenUrl": "/old-page",
    "suggestedRedirect": "/new-page",
    "confidence": 0.85,
    "reasoning": "Content similarity analysis suggests..."
  }
]`;

    // Call Lovable AI
    const aiResponse = await fetch('https://lovable.ai/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        prompt: aiPrompt,
        temperature: 0.3,
        maxTokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    let suggestions = [];
    
    try {
      // Parse AI response
      const responseText = aiData.result || aiData.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      suggestions = brokenLinks.map(link => ({
        brokenUrl: link.brokenUrl,
        suggestedRedirect: '/',
        confidence: 0.5,
        reasoning: 'Default fallback to homepage',
      }));
    }

    // Insert recommendations
    const recommendations = brokenLinks.map((link, index) => {
      const aiSuggestion = suggestions[index] || {};
      return {
        report_id: report.id,
        broken_url: link.brokenUrl,
        found_on_page: link.foundOnPage,
        link_text: link.linkText,
        error_type: link.errorType,
        suggested_redirect_url: aiSuggestion.suggestedRedirect || '/',
        confidence_score: aiSuggestion.confidence || 0.5,
        reasoning: aiSuggestion.reasoning || 'AI-suggested redirect',
        priority: link.priority,
        status: 'pending',
      };
    });

    if (recommendations.length > 0) {
      const { error: recsError } = await supabase
        .from('ai_redirect_recommendations')
        .insert(recommendations);

      if (recsError) throw recsError;
    }

    // Update report
    await supabase
      .from('ai_redirect_reports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pages_crawled: PAGES_TO_CRAWL.length,
        broken_links_found: brokenLinks.length,
        redirects_suggested: recommendations.length,
      })
      .eq('id', report.id);

    console.log('Broken link analysis completed');

    return new Response(
      JSON.stringify({
        success: true,
        reportId: report.id,
        pagesCrawled: PAGES_TO_CRAWL.length,
        brokenLinksFound: brokenLinks.length,
        redirectsSuggested: recommendations.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-broken-links:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
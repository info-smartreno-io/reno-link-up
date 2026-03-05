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

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { sessionId, message, conversationHistory } = await req.json();

    console.log('Copilot query:', message);

    // Fetch latest reports for context
    const [seoReport, performanceReport, redirectReport, errorReport, contentReport] = await Promise.all([
      supabase.from('ai_seo_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('ai_performance_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('ai_redirect_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('ai_error_log_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('ai_content_reports').select('*').order('created_at', { ascending: false }).limit(1).single(),
    ]);

    // Build context based on available reports
    let contextData = `SmartReno.io Site Health Context:\n\n`;

    if (seoReport.data) {
      contextData += `**SEO Status:**
- Last checked: ${new Date(seoReport.data.created_at).toLocaleDateString()}
- Pages analyzed: ${seoReport.data.pages_analyzed || 0}
- Recommendations: ${seoReport.data.recommendations_count || 0}
- Status: ${seoReport.data.status}

`;
    }

    if (performanceReport.data) {
      contextData += `**Performance Status:**
- Last audit: ${new Date(performanceReport.data.created_at).toLocaleDateString()}
- Pages audited: ${performanceReport.data.pages_audited || 0}
- Avg Performance Score: ${performanceReport.data.average_performance_score || 0}/100
- Avg Accessibility: ${performanceReport.data.average_accessibility_score || 0}/100
- Avg SEO: ${performanceReport.data.average_seo_score || 0}/100
- Issues found: ${performanceReport.data.issues_found || 0}

`;
    }

    if (redirectReport.data) {
      contextData += `**Broken Links Status:**
- Last scan: ${new Date(redirectReport.data.created_at).toLocaleDateString()}
- Pages crawled: ${redirectReport.data.pages_crawled || 0}
- Broken links: ${redirectReport.data.broken_links_found || 0}
- Redirects suggested: ${redirectReport.data.redirects_suggested || 0}

`;
    }

    if (errorReport.data) {
      contextData += `**Error Status:**
- Last analysis: ${new Date(errorReport.data.created_at).toLocaleDateString()}
- Total errors: ${errorReport.data.total_errors_found || 0}
- Error groups: ${errorReport.data.grouped_errors_count || 0}
- Critical: ${errorReport.data.critical_errors || 0}
- Warnings: ${errorReport.data.warnings || 0}

`;
    }

    if (contentReport.data) {
      contextData += `**Content Pipeline:**
- Last run: ${new Date(contentReport.data.created_at).toLocaleDateString()}
- Ideas generated: ${contentReport.data.ideas_generated || 0}
- Blog ideas: ${contentReport.data.blog_ideas || 0}
- Cost guide ideas: ${contentReport.data.cost_guide_ideas || 0}

`;
    }

    // Fetch specific details if query seems relevant
    let detailedContext = '';

    if (message.toLowerCase().includes('performance') || message.toLowerCase().includes('speed') || message.toLowerCase().includes('slow')) {
      const { data: audits } = await supabase
        .from('ai_performance_audits')
        .select('page_name, performance_score, lcp_value, cls_value, ai_summary, priority')
        .eq('report_id', performanceReport.data?.id)
        .order('performance_score', { ascending: true })
        .limit(3);

      if (audits && audits.length > 0) {
        detailedContext += `\n**Recent Performance Issues:**\n`;
        audits.forEach(audit => {
          detailedContext += `- ${audit.page_name}: ${audit.performance_score}/100 (${audit.priority} priority)\n`;
          detailedContext += `  LCP: ${audit.lcp_value?.toFixed(2)}s, CLS: ${audit.cls_value?.toFixed(3)}\n`;
          if (audit.ai_summary) {
            detailedContext += `  ${audit.ai_summary}\n`;
          }
        });
      }
    }

    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('bug') || message.toLowerCase().includes('problem')) {
      const { data: errors } = await supabase
        .from('ai_error_groups')
        .select('error_type, error_message, occurrence_count, severity, ai_analysis, suggested_fix')
        .eq('report_id', errorReport.data?.id)
        .order('severity', { ascending: false })
        .limit(3);

      if (errors && errors.length > 0) {
        detailedContext += `\n**Recent Errors:**\n`;
        errors.forEach(error => {
          detailedContext += `- ${error.error_type}: ${error.error_message}\n`;
          detailedContext += `  Severity: ${error.severity}, Occurrences: ${error.occurrence_count}\n`;
          if (error.ai_analysis) {
            detailedContext += `  Analysis: ${error.ai_analysis}\n`;
          }
          if (error.suggested_fix) {
            detailedContext += `  Fix: ${error.suggested_fix}\n`;
          }
        });
      }
    }

    if (message.toLowerCase().includes('link') || message.toLowerCase().includes('404') || message.toLowerCase().includes('redirect')) {
      const { data: redirects } = await supabase
        .from('ai_redirect_recommendations')
        .select('broken_url, found_on_page, suggested_redirect_url, reasoning, priority')
        .eq('report_id', redirectReport.data?.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(3);

      if (redirects && redirects.length > 0) {
        detailedContext += `\n**Broken Links Needing Attention:**\n`;
        redirects.forEach(redirect => {
          detailedContext += `- ${redirect.broken_url} (found on ${redirect.found_on_page})\n`;
          detailedContext += `  Suggested: ${redirect.suggested_redirect_url}\n`;
          if (redirect.reasoning) {
            detailedContext += `  ${redirect.reasoning}\n`;
          }
        });
      }
    }

    // System prompt with context
    const systemPrompt = `You are the Site Health Copilot for SmartReno.io, a home renovation platform in New Jersey.

Your role is to help administrators understand and manage:
- SEO performance and content optimization
- Website performance metrics
- Broken links and redirects
- Error logs and system health
- Content pipeline and ideas

${contextData}${detailedContext}

Answer questions clearly and provide actionable advice. When discussing issues, reference specific metrics and suggest concrete next steps. Be concise but thorough.`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Call Lovable AI with streaming
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    // Store the conversation if session exists
    if (sessionId) {
      await supabase.from('ai_copilot_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: message,
        context_used: { reports: [seoReport.data?.id, performanceReport.data?.id, redirectReport.data?.id, errorReport.data?.id].filter(Boolean) }
      });
    }

    // Return streaming response
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

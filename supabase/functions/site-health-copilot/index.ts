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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { sessionId, message, history } = await req.json();

    console.log('Site Health Copilot query:', message);

    // Gather context from all AI systems
    const context = await gatherSiteHealthContext(supabase);

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Get AI response
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await queryAI(lovableApiKey, systemPrompt, message, history || []);

    // Save message to session
    let finalSessionId = sessionId;
    
    if (!sessionId) {
      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from('ai_copilot_sessions')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      finalSessionId = newSession.id;
    }

    // Save user message
    await supabase.from('ai_copilot_messages').insert({
      session_id: finalSessionId,
      role: 'user',
      content: message,
    });

    // Save assistant message
    await supabase.from('ai_copilot_messages').insert({
      session_id: finalSessionId,
      role: 'assistant',
      content: aiResponse,
      context_used: context,
    });

    // Update session timestamp
    await supabase
      .from('ai_copilot_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', finalSessionId);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: finalSessionId,
        response: aiResponse,
        contextUsed: context,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in site-health-copilot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherSiteHealthContext(supabase: any) {
  const context: any = {
    timestamp: new Date().toISOString(),
    reports: {},
  };

  try {
    // Get latest SEO report
    const { data: seoReport } = await supabase
      .from('ai_seo_reports')
      .select('*, ai_seo_recommendations(count)')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (seoReport) {
      context.reports.seo = {
        status: seoReport.status,
        pagesAnalyzed: seoReport.pages_analyzed,
        recommendationsCount: seoReport.recommendations_count,
        completedAt: seoReport.completed_at,
        reportId: seoReport.id,
      };
    }

    // Get latest redirect report
    const { data: redirectReport } = await supabase
      .from('ai_redirect_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (redirectReport) {
      context.reports.redirects = {
        brokenLinksFound: redirectReport.broken_links_found,
        pagesCrawled: redirectReport.pages_crawled,
        redirectsSuggested: redirectReport.redirects_suggested,
        status: redirectReport.status,
        reportId: redirectReport.id,
      };
    }

    // Get latest performance report
    const { data: perfReport } = await supabase
      .from('ai_performance_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (perfReport) {
      context.reports.performance = {
        averagePerformanceScore: perfReport.average_performance_score,
        averageSeoScore: perfReport.average_seo_score,
        averageAccessibilityScore: perfReport.average_accessibility_score,
        pagesAudited: perfReport.pages_audited,
        issuesFound: perfReport.issues_found,
        reportId: perfReport.id,
      };
    }

    // Get latest error log report
    const { data: errorReport } = await supabase
      .from('ai_error_log_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (errorReport) {
      context.reports.errors = {
        totalErrorsFound: errorReport.total_errors_found,
        groupedErrorsCount: errorReport.grouped_errors_count,
        criticalErrors: errorReport.critical_errors,
        warnings: errorReport.warnings,
        timeRangeHours: errorReport.time_range_hours,
        reportId: errorReport.id,
      };
    }

    // Get latest content report
    const { data: contentReport } = await supabase
      .from('ai_content_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (contentReport) {
      context.reports.content = {
        ideasGenerated: contentReport.ideas_generated,
        blogIdeas: contentReport.blog_ideas,
        costGuideIdeas: contentReport.cost_guide_ideas,
        keywordSuggestions: contentReport.keyword_suggestions,
        reportId: contentReport.id,
      };
    }

    // Get critical issues counts
    const { count: criticalSEO } = await supabase
      .from('ai_seo_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'high')
      .eq('status', 'pending');

    const { count: criticalPerf } = await supabase
      .from('ai_performance_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('impact', 'high')
      .eq('status', 'pending');

    const { count: criticalErrors } = await supabase
      .from('ai_error_groups')
      .select('*', { count: 'exact', head: true })
      .in('severity', ['critical', 'high'])
      .eq('status', 'new');

    context.criticalIssues = {
      seo: criticalSEO || 0,
      performance: criticalPerf || 0,
      errors: criticalErrors || 0,
    };

  } catch (err) {
    console.error('Error gathering context:', err);
  }

  return context;
}

function buildSystemPrompt(context: any): string {
  return `You are the Site Health Copilot for SmartReno, an AI assistant that helps administrators understand and improve their website's health across SEO, performance, broken links, error logs, and content strategy.

**Your Capabilities:**
- Analyze SEO recommendations and explain optimization priorities
- Interpret performance metrics (Core Web Vitals, Lighthouse scores)
- Explain broken link issues and redirect strategies
- Help debug errors by analyzing error patterns
- Suggest content strategy based on generated ideas and keywords
- Provide actionable insights and next steps

**Current Site Health Context:**
${JSON.stringify(context, null, 2)}

**Guidelines:**
1. Be concise and actionable - focus on what matters most
2. Prioritize critical issues (red flags) over minor optimizations
3. Explain technical concepts in business terms
4. Reference specific report data when answering
5. Suggest concrete next steps
6. If data is missing, explain what reports need to be run first

**Common Questions You Can Answer:**
- "What are the most critical issues right now?"
- "How's our SEO performance?"
- "Are there any broken links I should fix?"
- "What errors are affecting the site?"
- "What content should we create next?"
- "How can I improve our Core Web Vitals?"

Answer questions directly and helpfully. If you need more specific data, tell the user which report to run.`;
}

async function queryAI(apiKey: string, systemPrompt: string, userMessage: string, history: any[]): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6), // Keep last 3 exchanges for context
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';
}

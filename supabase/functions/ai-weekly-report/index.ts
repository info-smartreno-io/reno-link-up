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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather weekly metrics
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Homeowner leads
    const { data: homeownerLeads } = await supabase
      .from('homeowner_leads')
      .select('*')
      .gte('created_at', weekAgo);

    // Contractor leads
    const { data: contractorLeads } = await supabase
      .from('contractor_leads')
      .select('*')
      .gte('created_at', weekAgo);

    // SEO pages generated
    const { data: seoPages } = await supabase
      .from('seo_pages')
      .select('*')
      .gte('created_at', weekAgo);

    // Conversion events
    const { data: conversionEvents } = await supabase
      .from('conversion_events')
      .select('*')
      .gte('created_at', weekAgo);

    // Content updates
    const { data: contentUpdates } = await supabase
      .from('seo_content_updates')
      .select('*')
      .gte('updated_at', weekAgo);

    // Contractor outreach
    const { data: contractorReferrals } = await supabase
      .from('contractor_referrals')
      .select('*')
      .gte('created_at', weekAgo);

    // Build AI prompt
    const prompt = `
Generate a comprehensive weekly performance report for SmartReno's lead generation engine.

Data from the past 7 days:

HOMEOWNER ACQUISITION:
- New Leads: ${homeownerLeads?.length || 0}
- Lead Sources: ${JSON.stringify(countByField(homeownerLeads, 'lead_source'))}
- Project Types: ${JSON.stringify(countByField(homeownerLeads, 'project_type'))}

CONTRACTOR ACQUISITION:
- New Contractor Leads: ${contractorLeads?.length || 0}
- Quality Scores: ${JSON.stringify(getQualityScoreDistribution(contractorLeads))}
- Outreach Status: ${JSON.stringify(countByField(contractorLeads, 'outreach_status'))}
- Referrals Generated: ${contractorReferrals?.length || 0}

SEO PERFORMANCE:
- New SEO Pages: ${seoPages?.length || 0}
- Page Types: ${JSON.stringify(countByField(seoPages, 'page_type'))}
- Content Updates: ${contentUpdates?.length || 0}
- Average AI Score: ${calculateAverage(contentUpdates, 'ai_score')}

CONVERSION METRICS:
- Total Events: ${conversionEvents?.length || 0}
- Event Types: ${JSON.stringify(countByField(conversionEvents, 'event_type'))}
- Conversions: ${conversionEvents?.filter(e => e.event_type === 'intake_complete').length || 0}

Provide a detailed analysis with:
1. Key achievements and wins
2. Areas needing attention
3. Top 5 actionable recommendations
4. Growth opportunities
5. Predicted next week performance

Return as JSON:
{
  "overall_health_score": <0-100>,
  "key_metrics": {
    "homeowner_leads": <number>,
    "contractor_leads": <number>,
    "conversion_rate": <percentage>,
    "content_quality": <0-100>
  },
  "wins": ["win1", "win2", ...],
  "concerns": ["concern1", "concern2", ...],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "homeowner|contractor|seo|conversion",
      "action": "detailed action",
      "expected_impact": "impact description"
    }
  ],
  "next_week_forecast": {
    "predicted_homeowner_leads": <number>,
    "predicted_contractor_leads": <number>,
    "confidence": <0-100>
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    let report;

    try {
      const content = aiData.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      report = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      report = {
        overall_health_score: 50,
        key_metrics: {},
        wins: [],
        concerns: ['Unable to generate detailed analysis'],
        recommendations: [],
        next_week_forecast: {},
      };
    }

    // Store report
    await supabase.from('ai_agent_activity').insert({
      agent_type: 'weekly_reporter',
      user_id: '00000000-0000-0000-0000-000000000000',
      user_role: 'admin',
      input: { week_start: weekAgo },
      output: report,
      status: 'completed',
    } as any);

    return new Response(
      JSON.stringify({
        ...report,
        raw_data: {
          homeowner_leads: homeownerLeads?.length,
          contractor_leads: contractorLeads?.length,
          seo_pages: seoPages?.length,
          conversion_events: conversionEvents?.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Weekly report error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function countByField(data: any[] | null, field: string): Record<string, number> {
  if (!data) return {};
  return data.reduce((acc, item) => {
    const value = item[field] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getQualityScoreDistribution(data: any[] | null): Record<string, number> {
  if (!data) return {};
  const ranges = { 'high (80+)': 0, 'medium (60-79)': 0, 'low (<60)': 0 };
  data.forEach(item => {
    const score = item.quality_score || 0;
    if (score >= 80) ranges['high (80+)']++;
    else if (score >= 60) ranges['medium (60-79)']++;
    else ranges['low (<60)']++;
  });
  return ranges;
}

function calculateAverage(data: any[] | null, field: string): number {
  if (!data || data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
  return Math.round(sum / data.length);
}

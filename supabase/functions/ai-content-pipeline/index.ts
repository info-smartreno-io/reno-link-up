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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reportType = 'monthly' } = await req.json().catch(() => ({}));

    console.log(`Starting content pipeline generation: ${reportType}`);

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('ai_content_reports')
      .insert({ status: 'running', report_type: reportType })
      .select()
      .single();

    if (reportError || !report) {
      throw new Error(`Failed to create report: ${reportError?.message}`);
    }

    const reportId = report.id;

    // SmartReno-specific context
    const renovationContext = `
SmartReno is a platform for home renovation projects. Key areas:
- Kitchen remodels, bathroom renovations, basement finishing
- Homeowners need cost estimates, contractor matching, project management
- Target locations: Major US cities and suburbs
- Project types: Full remodels, repairs, additions, outdoor projects
- Pain points: Budget uncertainty, contractor trust, timeline delays
    `.trim();

    let blogIdeas = 0;
    let costGuideIdeas = 0;
    let keywordCount = 0;

    // Generate blog post ideas
    if (lovableApiKey) {
      try {
        const blogPrompt = `${renovationContext}

Generate 10 high-value blog post ideas for SmartReno that:
1. Address homeowner pain points
2. Target informational search intent
3. Support SEO with long-tail keywords
4. Drive conversions (estimates, contractor matching)

For each idea, provide:
- Title (SEO-optimized, engaging)
- Description (2-3 sentences)
- Target keywords (3-5)
- Estimated search volume (low/medium/high)
- Priority (low/medium/high)
- Brief outline (3-5 bullet points)

Format as JSON array.`;

        const blogResult = await generateWithAI(lovableApiKey, blogPrompt);
        const blogs = parseContentIdeas(blogResult, 'blog_post');
        
        for (const idea of blogs) {
          await supabase.from('ai_content_ideas').insert({
            report_id: reportId,
            content_type: 'blog_post',
            ...idea,
          });
          blogIdeas++;
        }
      } catch (err) {
        console.error('Blog generation failed:', err);
      }

      // Generate cost guide ideas
      try {
        const costGuidePrompt = `${renovationContext}

Generate 8 cost guide expansion ideas for SmartReno covering:
- Specific renovation types (e.g., "Kitchen Island Installation Cost")
- Location-based guides (e.g., "Bathroom Remodel Cost in Austin, TX")
- Material comparisons (e.g., "Granite vs Quartz Countertops Cost")

For each guide:
- Title (specific, includes location or material if relevant)
- Description
- Target keywords
- Priority
- Outline of cost factors to cover

Format as JSON array.`;

        const costResult = await generateWithAI(lovableApiKey, costGuidePrompt);
        const guides = parseContentIdeas(costResult, 'cost_guide');
        
        for (const idea of guides) {
          await supabase.from('ai_content_ideas').insert({
            report_id: reportId,
            content_type: 'cost_guide',
            ...idea,
          });
          costGuideIdeas++;
        }
      } catch (err) {
        console.error('Cost guide generation failed:', err);
      }

      // Generate keyword research
      try {
        const keywordPrompt = `${renovationContext}

Identify 15 high-opportunity keywords for SmartReno focusing on:
1. Commercial intent ("hire contractor", "get estimate")
2. Location + service combinations
3. Problem-solving queries ("how to fix", "cost to")
4. Comparison queries ("vs", "best")

For each keyword:
- Keyword phrase
- Search intent (informational/commercial/transactional)
- Estimated volume (number or low/medium/high)
- Competition level
- Related keywords (3-5)
- Content gap opportunity
- Suggested content types

Format as JSON array.`;

        const kwResult = await generateWithAI(lovableApiKey, keywordPrompt);
        const keywords = parseKeywordData(kwResult);
        
        for (const kw of keywords) {
          await supabase.from('ai_keyword_research').insert({
            report_id: reportId,
            ...kw,
          });
          keywordCount++;
        }
      } catch (err) {
        console.error('Keyword research failed:', err);
      }
    }

    const totalIdeas = blogIdeas + costGuideIdeas;

    // Update report
    await supabase
      .from('ai_content_reports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ideas_generated: totalIdeas,
        blog_ideas: blogIdeas,
        cost_guide_ideas: costGuideIdeas,
        keyword_suggestions: keywordCount,
      })
      .eq('id', reportId);

    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        summary: {
          totalIdeas,
          blogIdeas,
          costGuideIdeas,
          keywords: keywordCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-content-pipeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateWithAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a content strategy expert specializing in home renovation and construction SEO. Return valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseContentIdeas(aiResponse: string, contentType: string): any[] {
  try {
    // Extract JSON from markdown code blocks if present
    let jsonStr = aiResponse.trim();
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonStr);
    const ideas = Array.isArray(parsed) ? parsed : [parsed];

    return ideas.map((idea: any) => ({
      title: idea.title || idea.Title || 'Untitled',
      description: idea.description || idea.Description || '',
      target_keywords: Array.isArray(idea.keywords || idea.target_keywords) 
        ? (idea.keywords || idea.target_keywords)
        : [],
      priority: (idea.priority || 'medium').toLowerCase(),
      ai_outline: idea.outline || idea.Outline || null,
      ai_reasoning: idea.reasoning || idea.Reasoning || null,
      estimated_word_count: idea.word_count || idea.estimated_word_count || 1500,
      seo_potential_score: idea.seo_score || 0.7,
      search_volume_estimate: parseSearchVolume(idea.search_volume || idea.volume),
      competition_level: (idea.competition || 'medium').toLowerCase(),
    }));
  } catch (err) {
    console.error('Failed to parse content ideas:', err);
    return [];
  }
}

function parseKeywordData(aiResponse: string): any[] {
  try {
    let jsonStr = aiResponse.trim();
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonStr);
    const keywords = Array.isArray(parsed) ? parsed : [parsed];

    return keywords.map((kw: any) => ({
      keyword: kw.keyword || kw.Keyword || '',
      search_intent: (kw.intent || kw.search_intent || 'informational').toLowerCase(),
      search_volume_estimate: parseSearchVolume(kw.volume || kw.search_volume),
      competition: (kw.competition || 'medium').toLowerCase(),
      related_keywords: Array.isArray(kw.related || kw.related_keywords) 
        ? (kw.related || kw.related_keywords)
        : [],
      content_gap_opportunity: kw.opportunity || kw.content_gap || null,
      suggested_content_types: Array.isArray(kw.content_types || kw.suggested_content)
        ? (kw.content_types || kw.suggested_content)
        : ['blog_post'],
      priority_score: kw.priority_score || kw.score || 0.5,
    }));
  } catch (err) {
    console.error('Failed to parse keywords:', err);
    return [];
  }
}

function parseSearchVolume(vol: any): number {
  if (typeof vol === 'number') return vol;
  if (typeof vol === 'string') {
    const lower = vol.toLowerCase();
    if (lower.includes('high')) return 5000;
    if (lower.includes('medium')) return 1000;
    if (lower.includes('low')) return 100;
    const num = parseInt(vol.replace(/\D/g, ''));
    return isNaN(num) ? 500 : num;
  }
  return 500;
}

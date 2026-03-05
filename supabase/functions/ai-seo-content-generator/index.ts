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

    const { page_id, refresh_type } = await req.json();

    // Get the page
    const { data: page, error: pageError } = await supabase
      .from('seo_pages')
      .select('*')
      .eq('id', page_id)
      .single();

    if (pageError || !page) {
      throw new Error('SEO page not found');
    }

    // Call Lovable AI to generate/refresh content
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = buildContentPrompt(page, refresh_type);

    const aiResponse = await fetch('https://api.lovable.app/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO content writer specializing in home renovation and construction. Generate engaging, informative content that ranks well and converts visitors into leads.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${await aiResponse.text()}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;

    // Parse the AI response (expecting JSON)
    let updatedContent;
    try {
      updatedContent = JSON.parse(generatedContent);
    } catch {
      // If not JSON, create a basic structure
      updatedContent = {
        sections: [
          {
            id: '1',
            type: 'intro',
            content: generatedContent,
            order: 1,
          },
        ],
      };
    }

    // Update the page
    const { data: updated, error: updateError } = await supabase
      .from('seo_pages')
      .update({
        content: updatedContent,
        last_ai_refresh: new Date().toISOString(),
        needs_refresh: false,
      })
      .eq('id', page_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the update
    await supabase
      .from('seo_content_updates')
      .insert({
        page_path: page.slug,
        page_type: page.page_type,
        target_location: page.town || page.county,
        target_project: page.project_type,
        update_type: refresh_type,
        update_summary: `AI ${refresh_type} for ${page.title}`,
        changes_made: {
          old_content_length: JSON.stringify(page.content).length,
          new_content_length: JSON.stringify(updatedContent).length,
          ai_model: 'google/gemini-2.5-flash',
        },
        ai_confidence_score: 85,
        status: 'applied',
        applied_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        success: true,
        page_id,
        message: 'Content refreshed successfully',
        content_preview: JSON.stringify(updatedContent).substring(0, 200),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-seo-content-generator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

function buildContentPrompt(page: any, refreshType: string): string {
  const baseInfo = `
Page Type: ${page.page_type}
Location: ${page.town || page.county || 'Northern NJ'}
Project Type: ${page.project_type || 'General home renovation'}
Current Title: ${page.title}
`;

  if (refreshType === 'content_refresh') {
    return `${baseInfo}

Generate fresh, engaging content for this SEO page. Keep the same structure but improve:
- Keyword optimization
- Local relevance
- Compelling copy
- Clear CTAs

Return as JSON with this structure:
{
  "sections": [
    {
      "id": "1",
      "type": "hero",
      "heading": "Engaging headline",
      "content": "Compelling opening paragraph",
      "order": 1
    },
    ...more sections
  ],
  "faqs": [
    {
      "question": "Relevant question",
      "answer": "Helpful answer"
    }
  ]
}`;
  }

  if (refreshType === 'new_section') {
    return `${baseInfo}

Generate a new content section about local expertise and benefits. Include:
- Why choose local contractors
- Understanding local building codes
- Typical project timelines
- Cost factors specific to this area

Return as JSON with a single section object.`;
  }

  return `${baseInfo}

Optimize and refresh this page's content for better SEO and conversion. Return as structured JSON.`;
}

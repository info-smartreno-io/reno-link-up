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
    const { keywords, targetLocation, projectType, contentIdeaId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let promptKeywords = keywords;
    let promptLocation = targetLocation;
    let promptProjectType = projectType;
    let ideaTitle = null;
    let ideaDescription = null;
    let ideaOutline = null;

    // If generating from content idea, fetch its details
    if (contentIdeaId) {
      const { data: idea, error: ideaError } = await supabase
        .from('ai_content_ideas')
        .select('*')
        .eq('id', contentIdeaId)
        .single();

      if (ideaError || !idea) {
        throw new Error('Content idea not found');
      }

      promptKeywords = idea.target_keywords || [];
      promptLocation = idea.target_location;
      promptProjectType = idea.project_type;
      ideaTitle = idea.title;
      ideaDescription = idea.description;
      ideaOutline = idea.ai_outline;
    }

    const prompt = ideaTitle 
      ? `You are SmartReno's SEO content writer. Create a comprehensive, SEO-optimized blog article based on this approved content idea.

TITLE: ${ideaTitle}
DESCRIPTION: ${ideaDescription}
KEYWORDS: ${promptKeywords.join(", ")}
TARGET LOCATION: ${promptLocation || "New Jersey"}
PROJECT TYPE: ${promptProjectType}
OUTLINE: ${ideaOutline || "Not provided"}

Write a detailed, helpful blog post (1500-2000 words) that:
1. Targets the keywords naturally
2. Provides real value to homeowners
3. Includes local insights about ${promptLocation}
4. Mentions SmartReno's services appropriately
5. Includes actionable tips and cost estimates
6. Has clear H2 and H3 headings
7. Encourages readers to get a free consultation

Use SmartReno's voice: professional, helpful, trustworthy, local expert.

Provide a JSON response with:
{
  "title": "${ideaTitle}",
  "meta_description": "Engaging meta description (under 160 chars)",
  "slug": "url-friendly-slug",
  "content": "Full article in markdown format with H2 and H3 headings",
  "keywords": ${JSON.stringify(promptKeywords)},
  "internal_links": ["Suggested internal pages to link to"],
  "image_suggestions": ["Image description 1", "Image description 2"]
}`
      : `You are SmartReno's SEO content writer. Create a comprehensive, SEO-optimized blog article.

KEYWORDS: ${promptKeywords.join(", ")}
TARGET LOCATION: ${promptLocation || "New Jersey"}
PROJECT TYPE: ${promptProjectType}

Write a detailed, helpful blog post (800-1200 words) that:
1. Targets the keywords naturally
2. Provides real value to homeowners
3. Includes local insights about ${promptLocation}
4. Mentions SmartReno's services appropriately
5. Includes actionable tips
6. Has clear headings and structure
7. Encourages readers to get a free consultation

Use SmartReno's voice: professional, helpful, trustworthy, local expert.

Provide a JSON response with:
{
  "title": "Compelling, SEO-friendly title (under 60 chars)",
  "meta_description": "Engaging meta description (under 160 chars)",
  "slug": "url-friendly-slug",
  "content": "Full article in markdown format",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "internal_links": ["Suggested internal pages to link to"],
  "image_suggestions": ["Image description 1", "Image description 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an SEO content writer for SmartReno. Always respond with valid JSON. Write engaging, valuable content." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let result = data.choices[0].message.content;

    if (result.startsWith("```json")) {
      result = result.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    const blogPost = JSON.parse(result);

    // Store as draft
    const { data: savedPost, error: saveError } = await supabase
      .from("ai_blog_posts")
      .insert({
        content_idea_id: contentIdeaId || null,
        title: blogPost.title,
        slug: blogPost.slug,
        content: blogPost.content,
        meta_description: blogPost.meta_description,
        keywords: blogPost.keywords,
        target_location: promptLocation,
        project_type: promptProjectType,
        generated_by: user.id,
        status: "draft"
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Update content idea status if generated from idea
    if (contentIdeaId) {
      await supabase
        .from('ai_content_ideas')
        .update({ status: 'blog_generated' })
        .eq('id', contentIdeaId);
    }

    console.log("Blog post generated:", blogPost.title);

    return new Response(
      JSON.stringify({ ...blogPost, id: savedPost.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-blog-generator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
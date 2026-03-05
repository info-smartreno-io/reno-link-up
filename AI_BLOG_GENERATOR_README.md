# AI Blog Generator

## Overview

The AI Blog Generator converts approved content ideas into full, SEO-optimized blog posts using Lovable AI (Google Gemini 2.5 Flash). This tool integrates with the Content Pipeline to transform blog post ideas into publication-ready articles.

## Features

### 1. **Content Idea Integration**
- Fetches approved blog post ideas from the Content Pipeline
- Displays ideas with target keywords and descriptions
- One-click generation from approved ideas

### 2. **AI-Powered Blog Generation**
- Generates 1500-2000 word blog posts in markdown format
- Creates SEO-optimized content with proper heading structure
- Naturally incorporates target keywords throughout
- Includes practical tips, cost estimates, and actionable advice
- Generates compelling meta descriptions (150-160 characters)
- Creates URL-friendly slugs automatically

### 3. **Blog Post Management**
- Draft status for review before publishing
- Preview generated content with full markdown rendering
- Publish workflow with one-click publishing
- Track generation metadata (author, dates, status)

### 4. **SEO Optimization**
- Auto-generated meta descriptions
- Keyword integration in content
- URL-friendly slugs
- Structured heading hierarchy (H2, H3)
- Target location and project type metadata

## Components

### Database Schema (`ai_blog_posts`)

```sql
- id: UUID (primary key)
- content_idea_id: UUID (references ai_content_ideas)
- title: TEXT (blog post title)
- slug: TEXT (URL-friendly slug, unique)
- content: TEXT (full markdown content)
- meta_description: TEXT (SEO meta description)
- keywords: TEXT[] (target keywords)
- target_location: TEXT (geographic target)
- project_type: TEXT (renovation type)
- status: TEXT (draft, review, published, archived)
- generated_by: UUID (admin who generated)
- reviewed_by: UUID (admin who reviewed)
- published_at: TIMESTAMPTZ (publication date)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Edge Function (`ai-blog-generator`)

**Endpoint:** `POST /functions/v1/ai-blog-generator`

**Request Body:**
```json
{
  "contentIdeaId": "uuid"
}
```

**Process:**
1. Authenticates admin user
2. Fetches content idea details
3. Generates full blog post using AI (1500-2000 words)
4. Generates SEO meta description (150-160 characters)
5. Creates URL-friendly slug
6. Saves blog post as draft
7. Updates content idea status to 'blog_generated'

**Response:**
```json
{
  "success": true,
  "blogPost": {
    "id": "uuid",
    "title": "string",
    "slug": "string",
    "content": "markdown string",
    "meta_description": "string",
    "status": "draft"
  }
}
```

### Admin UI Component (`BlogGeneratorPanel`)

Located in: `/admin/ai` → Website AI Enhancements page

**Features:**
- **Content Ideas Tab:** Lists approved content ideas with "Generate" button
- **Generated Posts Tab:** Shows all blog posts with status badges
- **Preview Dialog:** Full markdown rendering with meta description
- **Publish Button:** One-click publishing from draft to published
- **Status Tracking:** Visual badges for draft, review, published, archived

## AI Prompting Strategy

### Blog Post Generation Prompt

```
You are an expert content writer for SmartReno, a home renovation platform.

Generate a comprehensive, SEO-optimized blog post based on this content idea:
- Title, description, keywords, project type, location
- AI outline from Content Pipeline

Requirements:
1. Write 1500-2000 word blog post in markdown
2. Engaging introduction that hooks the reader
3. H2 and H3 headings for structure
4. Natural keyword incorporation
5. Practical tips, cost estimates, actionable advice
6. Compelling conclusion with call-to-action
7. Friendly, informative tone
8. Focus on real value for homeowners
```

### Meta Description Generation Prompt

```
Write a compelling 150-160 character meta description that:
1. Includes primary keyword naturally
2. Entices clicks from search results
3. Accurately describes content
4. Includes benefit or value proposition
```

## Usage

### Generating a Blog Post

1. Navigate to `/admin/ai`
2. Select "Website AI Enhancements" section
3. Click "Content Ideas" tab in Blog Generator panel
4. Review approved content ideas
5. Click "Generate" on desired idea
6. Wait for AI generation (typically 30-60 seconds)
7. Review generated post in "Generated Posts" tab

### Publishing Workflow

1. Click "Preview" to review generated content
2. Verify content quality, keyword usage, and SEO optimization
3. Click "Publish" to make live
4. Blog post status changes to "published"
5. Publication timestamp recorded

### Content Quality Checklist

- ✅ 1500-2000 words
- ✅ Engaging introduction
- ✅ Clear H2/H3 structure
- ✅ Keywords naturally integrated
- ✅ Practical tips and cost estimates
- ✅ Compelling conclusion with CTA
- ✅ Meta description under 160 characters
- ✅ URL-friendly slug

## Security

- **RLS Policies:** Only admin users can generate and manage blog posts
- **Authentication:** Requires valid admin user session
- **API Key:** LOVABLE_API_KEY automatically provided by Lovable Cloud
- **Content Validation:** All inputs sanitized and validated

## Performance

- **Generation Time:** 30-60 seconds per blog post
- **Caching:** Blog posts cached after generation
- **Optimization:** Batch processing for multiple posts coming soon

## Integration

### With Content Pipeline
- Reads approved content ideas from `ai_content_ideas`
- Updates idea status to 'blog_generated' after generation
- Links blog posts back to original content ideas

### With Website
- Generated posts can be exported to CMS
- Slug-based routing for SEO-friendly URLs
- Meta descriptions ready for HTML head tags

## Future Enhancements

1. **Bulk Generation:** Generate multiple blog posts at once
2. **Custom Templates:** Allow custom blog post templates
3. **Image Generation:** Auto-generate featured images
4. **Internal Linking:** Automatically suggest internal links
5. **Revision History:** Track edits and versions
6. **WordPress Integration:** Direct publishing to WordPress
7. **Social Media Snippets:** Auto-generate social media posts
8. **A/B Testing:** Generate multiple versions for testing
9. **Content Scoring:** AI-powered content quality scoring
10. **SEO Analysis:** Real-time SEO score and suggestions

## API Model

**Model:** `google/gemini-2.5-flash`
- Balanced performance and cost
- Excellent for long-form content generation
- Strong SEO writing capabilities
- Fast generation times

## Monitoring

- Track generation success/failure rates
- Monitor content quality metrics
- Analyze keyword usage patterns
- Measure time-to-publish workflow

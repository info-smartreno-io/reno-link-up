# AI Content Pipeline

## Overview
The AI Content Pipeline is a monthly content generation system that uses AI to identify high-value content opportunities, generate blog post ideas, cost guide expansions, and keyword research tailored to SmartReno's home renovation workflow.

## Features

### Content Idea Generation
- **Blog Posts**: SEO-optimized titles targeting homeowner pain points
- **Cost Guides**: Location and material-specific pricing guides
- **Landing Pages**: Conversion-focused service pages
- **FAQs**: Common homeowner questions
- **Case Studies**: Project success stories

### Keyword Research
- Commercial intent keywords ("hire contractor", "get estimate")
- Location + service combinations
- Problem-solving queries ("how to fix", "cost to")
- Comparison queries ("vs", "best")
- Search volume estimates and competition analysis

### AI-Powered Analysis
- Uses Lovable AI (Gemini 2.5 Flash) for content strategy
- SEO potential scoring (0.0-1.0)
- Priority ranking (low/medium/high)
- Content outlines and reasoning
- Related keyword suggestions

## Components

### Database Tables

#### `ai_content_reports`
- Stores each content generation run
- Tracks blog ideas, cost guides, keywords generated
- Status tracking (running/completed/failed)

#### `ai_content_ideas`
- Individual content ideas with full details
- Content type, title, description, keywords
- AI-generated outlines and reasoning
- SEO potential scores
- Status workflow (pending → approved → in_progress → completed)

#### `ai_keyword_research`
- Keyword opportunities with search data
- Search intent classification
- Competition levels
- Related keywords and content gaps
- Priority scores

### Edge Function: `ai-content-pipeline`
Located at: `supabase/functions/ai-content-pipeline/index.ts`

**Workflow:**
1. Creates content generation report
2. Generates blog post ideas (10 ideas)
3. Generates cost guide ideas (8 ideas)
4. Performs keyword research (15 keywords)
5. Stores all results in database
6. Updates report with summary statistics

**API:**
```typescript
// Generate content ideas
POST /functions/v1/ai-content-pipeline
Body: { reportType: 'monthly' | 'weekly' | 'on_demand' }

// Response
{
  success: true,
  reportId: "uuid",
  summary: {
    totalIdeas: 18,
    blogIdeas: 10,
    costGuideIdeas: 8,
    keywords: 15
  }
}
```

### Admin UI: Content Pipeline Tab
Located in: `src/pages/AdminAI.tsx`

**Features:**
- Run content generation (monthly/on-demand)
- View generation reports
- Browse content ideas by type (all/blog/cost guides)
- Review and approve/reject ideas
- View keyword opportunities
- Track idea status

## SmartReno Context

The AI is provided with SmartReno-specific context:
- Platform focus: Home renovation projects
- Key services: Cost estimates, contractor matching, project management
- Project types: Kitchen, bathroom, basement, additions, outdoor
- Target audience: Homeowners planning renovations
- Pain points: Budget uncertainty, contractor trust, timeline delays

This context ensures all generated content is relevant to SmartReno's business model.

## Content Types

### Blog Posts
**Focus:**
- Educational content addressing homeowner concerns
- "How to" guides for planning renovations
- Cost breakdown articles
- Contractor selection guides
- Project timeline expectations

**Example Titles:**
- "How Much Does a Kitchen Remodel Cost in 2025?"
- "10 Questions to Ask Before Hiring a Contractor"
- "Complete Guide to Bathroom Renovation Timelines"

### Cost Guides
**Focus:**
- Location-specific pricing (e.g., "Austin, TX")
- Material comparisons (granite vs quartz)
- Project-specific costs (kitchen islands, deck installation)
- Cost factors breakdown

**Example Titles:**
- "Kitchen Island Installation Cost Guide 2025"
- "Bathroom Remodel Cost in Austin, TX"
- "Granite vs Quartz Countertops: Cost Comparison"

### Keyword Research
**Categories:**
1. **Commercial Intent**: hire, get quote, find contractor
2. **Informational**: how to, what is, guide to
3. **Transactional**: book, schedule, request estimate
4. **Navigational**: company names, service pages

## Usage

### Running Content Generation
1. Navigate to `/admin/ai` → "Content Pipeline" tab
2. Click "Generate Content Ideas"
3. Wait for completion (30-90 seconds)
4. Review generated ideas and keywords

### Managing Content Ideas
1. Click on a report to view its content ideas
2. Use tabs to filter by content type
3. For each idea:
   - **Approve**: Mark for content creation
   - **Start**: Begin working on it
   - **Reject**: Dismiss the idea
4. Track progress with status badges

### Keyword Opportunities
- View keyword research results
- See search volume estimates
- Identify content gap opportunities
- Plan content calendar around high-value keywords

## Best Practices

### Content Strategy
- Run pipeline monthly for fresh ideas
- Prioritize high-priority, high-SEO-score ideas
- Balance blog posts and cost guides
- Target both informational and commercial intent

### SEO Optimization
- Use suggested keywords in content
- Follow AI-generated outlines
- Create comprehensive, helpful content
- Target location-specific queries for local SEO

### Content Calendar
- Approve 4-6 ideas per month
- Mix content types (blogs, guides, pages)
- Align with business priorities
- Track completion rates

## AI Prompting Strategy

### Blog Post Prompt
Focuses on:
- Homeowner pain points
- Long-tail keywords
- Conversion opportunities
- SEO best practices

### Cost Guide Prompt
Emphasizes:
- Specific renovation types
- Location targeting
- Material comparisons
- Comprehensive cost factors

### Keyword Prompt
Targets:
- Commercial and transactional intent
- Location + service combinations
- Problem-solving queries
- Competitive gaps

## Integration

### Automated Scheduling
To run monthly:
1. Create a cron job (pg_cron)
2. Schedule for 1st of each month
3. Call edge function endpoint
4. Email notification to content team

### Content Management System
Export approved ideas to:
- WordPress (via API)
- Notion (via API)
- Google Sheets (manual export)
- Custom CMS

### Analytics Integration
Track:
- Idea approval rates
- Content completion rates
- SEO performance of published content
- Keyword ranking improvements

## Future Enhancements

### Planned Features
- Content outline expansion (full drafts)
- Competitor content analysis
- Trending topic detection
- Seasonal content suggestions
- Video/podcast topic ideas
- Social media post generation

### Advanced AI Features
- Content quality scoring
- Duplicate detection
- Brand voice consistency checks
- Multi-language support
- A/B title testing

## Performance

- Generation time: 30-90 seconds
- Ideas per run: 15-20
- Keywords per run: 10-15
- AI model: Gemini 2.5 Flash (fast, cost-effective)

## Security

- All tables protected by RLS (admin-only)
- Service role key for edge function
- No PII in generated content
- Safe keyword filtering

## Monitoring

The system logs:
- Generation start/completion
- Idea counts per type
- AI API successes/failures
- Parsing errors

Check edge function logs for system health.

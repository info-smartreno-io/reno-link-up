# SmartReno AI SEO Maintenance System

## Overview

Automated AI-driven SEO analysis and recommendation system for SmartReno. This module provides:

- **Weekly SEO Audits**: Automatically analyzes pages for meta tag optimization, internal linking, and content gaps
- **AI-Powered Recommendations**: Uses Lovable AI (Google Gemini 2.5 Flash) to generate actionable SEO improvements
- **Admin Dashboard**: Review, approve, or reject AI suggestions through an intuitive UI
- **Scalable Architecture**: Built to support 50+ county/town pages as SmartReno expands

## Components

### 1. Database Tables

**`ai_seo_reports`**
- Tracks each SEO analysis run
- Fields: report_type, status, pages_analyzed, recommendations_count, timestamps

**`ai_seo_recommendations`**
- Stores individual SEO suggestions
- Fields: page_path, page_type, recommendation_type, priority, current_value, suggested_value, reasoning, approval status

### 2. Edge Function

**`supabase/functions/ai-seo-refresh/index.ts`**
- Analyzes configured pages using Lovable AI
- Generates recommendations for:
  - Meta title optimization (location + service keywords)
  - Meta description improvements (under 160 chars)
  - Internal linking opportunities
  - Content gaps (thin content, missing H2s)
  - Structured data needs (JSON-LD)

### 3. Admin UI

**`/admin/ai`** - AI SEO Maintenance Dashboard
- View recent SEO analysis reports
- Browse AI-generated recommendations by priority
- Approve or reject suggestions
- Export reports for implementation

## Usage

### Running an SEO Analysis

1. Navigate to `/admin/ai` in the admin portal
2. Click "Run SEO Refresh" button
3. Wait for AI to analyze pages (typically 30-60 seconds)
4. Review recommendations in the dashboard

### Manual Trigger via Edge Function

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/ai-seo-refresh \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

### Automated Scheduling (Coming Soon)

Set up a weekly cron job using pg_cron:

```sql
SELECT cron.schedule(
  'weekly-seo-refresh',
  '0 2 * * 1', -- Every Monday at 2 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/ai-seo-refresh',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

## Recommendation Types

- **meta_title**: Optimize page title tags for SEO
- **meta_description**: Improve meta descriptions for CTR
- **internal_link**: Suggest internal linking opportunities
- **content_gap**: Identify missing or thin content sections
- **structured_data**: Recommend JSON-LD schema additions

## Priority Levels

- **High**: Critical SEO issues (missing meta tags, very thin content)
- **Medium**: Important improvements (better keyword targeting, internal links)
- **Low**: Nice-to-have enhancements (additional structured data)

## Configuration

### Pages Analyzed

Currently configured to analyze:
- Home page (`/`)
- Services index (`/services`)
- County pages (`/locations/bergen`, `/locations/passaic`)
- Calculators (`/calculators`)
- Cost guides (`/cost-guides`)

To add more pages, edit `supabase/functions/ai-seo-refresh/index.ts` and update the `pagesToAnalyze` array.

### AI Model

Uses `google/gemini-2.5-flash` via Lovable AI Gateway:
- No API key required (uses LOVABLE_API_KEY secret)
- Optimized for SEO analysis tasks
- Cost-effective and fast

## Architecture Notes

### Why Lovable AI?

- Pre-configured in Lovable Cloud (no setup needed)
- Included in workspace usage (no separate billing)
- Google Gemini 2.5 Flash is excellent for SEO analysis
- No rate limit concerns for weekly jobs

### Database Security

- RLS policies restrict access to authenticated users
- System (edge function) can insert/update without auth
- Admin approval required before implementing changes
- Audit trail of all approvals/rejections

### Scalability

Designed for SmartReno's expansion strategy:
- Handles 100+ pages without performance issues
- Parallelizable for faster analysis (future enhancement)
- Recommendations stored indefinitely for historical tracking
- Report archiving for compliance

## Integration with Existing SEO Utils

This system complements the existing SEO infrastructure:
- Reads from `/src/utils/seo.ts` location data
- Suggests improvements to JSON-LD schemas in `/src/components/seo/JsonLd.tsx`
- Feeds into sitemap generation (`/scripts/generateSitemap.ts`)
- Integrates with GA4 event tracking for content performance

## Next Steps

### Short-term Enhancements
1. Add sitemap crawler to auto-discover pages
2. Implement cron scheduling for weekly runs
3. Add email notifications for completed reports
4. Create export to CSV/PDF feature

### Long-term Roadmap
1. Content quality scoring (readability, E-E-A-T signals)
2. Competitor analysis integration
3. Keyword rank tracking
4. Page speed recommendations
5. Mobile-friendliness checks
6. Broken link detection
7. Redirect manager

## Monitoring

### Success Metrics
- Number of recommendations generated per week
- Approval rate (approved vs rejected)
- Time to implement approved changes
- SEO impact (track in GA4 after implementation)

### Logs
Check edge function logs:
```bash
supabase functions logs ai-seo-refresh
```

### Database Queries
```sql
-- Latest report summary
SELECT 
  created_at,
  status,
  pages_analyzed,
  recommendations_count
FROM ai_seo_reports
ORDER BY created_at DESC
LIMIT 5;

-- Pending recommendations by priority
SELECT 
  priority,
  COUNT(*) as count
FROM ai_seo_recommendations
WHERE status = 'pending'
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END;
```

## Support

For issues or feature requests:
1. Check edge function logs for errors
2. Review database tables for data integrity
3. Test with manual edge function invocation
4. Contact development team with error details

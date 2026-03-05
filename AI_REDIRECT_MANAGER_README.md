# AI Broken Link & Redirect Manager

## Overview

The AI Broken Link & Redirect Manager is an automated system that crawls SmartReno pages, detects broken links (404s, timeouts, invalid URLs), and uses AI to suggest intelligent redirects based on content similarity and site structure.

## Components

### 1. Database Tables

#### `ai_redirect_reports`
Tracks each broken link analysis run:
- `id` - Unique report identifier
- `created_at` - When analysis started
- `completed_at` - When analysis finished
- `status` - running | completed | failed
- `pages_crawled` - Number of pages analyzed
- `broken_links_found` - Total broken links detected
- `redirects_suggested` - Number of AI-suggested redirects
- `error_message` - Error details if failed

#### `ai_redirect_recommendations`
Stores individual broken link findings and redirect suggestions:
- `id` - Unique recommendation identifier
- `report_id` - Links to parent report
- `broken_url` - The broken link path
- `found_on_page` - Page where broken link was found
- `link_text` - The anchor text of the broken link
- `error_type` - 404 | 500 | timeout | invalid | external_broken
- `suggested_redirect_url` - AI-recommended redirect target
- `confidence_score` - AI confidence (0.0-1.0)
- `reasoning` - AI explanation for the suggestion
- `priority` - high | medium | low
- `status` - pending | approved | rejected | applied
- `applied_at` - When redirect was implemented
- `approved_by` - User who approved the redirect
- `approved_at` - When it was approved

### 2. Edge Function

**Location**: `supabase/functions/ai-broken-links/index.ts`

**What it does**:
1. Crawls predefined pages (homepage, portals, calculators, cost guides, etc.)
2. Detects broken links on each page
3. Uses Lovable AI (Google Gemini 2.5 Flash) to analyze broken links
4. AI suggests redirect targets based on:
   - Content similarity
   - Site structure
   - Available valid pages
   - SEO best practices
5. Stores findings in database with priority rankings

**Invocation**:
```typescript
await supabase.functions.invoke('ai-broken-links');
```

### 3. Admin Dashboard

**Location**: `src/pages/AdminAI.tsx` (Redirects Tab)

**Features**:
- **Run Analysis**: Trigger new broken link crawl
- **View Reports**: See history of all analyses
- **Review Recommendations**: 
  - View broken URLs with error types
  - See AI-suggested redirects with confidence scores
  - Read AI reasoning for each suggestion
  - Priority badges (high/medium/low)
  - Approve or reject suggestions
- **Status Tracking**: Monitor which redirects are pending/approved/rejected/applied

## Usage

### Running Analysis

1. Navigate to `/admin/ai` in admin portal
2. Click the "Broken Links & Redirects" tab
3. Click "Run Link Analysis" button
4. Wait for analysis to complete (usually 10-30 seconds)
5. Review results in the dashboard

### Reviewing Recommendations

Each broken link recommendation shows:
- **Broken URL**: The problematic link
- **Found On**: Which page contains the broken link
- **Error Type**: 404, 500, timeout, etc.
- **Priority**: High (homepage), Medium (services), Low (archive)
- **Suggested Redirect**: AI-recommended target URL
- **Confidence Score**: AI confidence percentage
- **Reasoning**: Why this redirect was suggested

### Approving/Rejecting

1. Review the AI suggestion and reasoning
2. Click "Approve" to accept the redirect
3. Click "Reject" to dismiss the suggestion
4. Approved redirects can be implemented via:
   - Vite redirect configuration
   - Edge function redirect handler
   - Client-side redirect logic

## Error Types

- **404**: Page not found
- **500**: Server error
- **timeout**: Request timed out
- **invalid**: Malformed URL
- **external_broken**: External link is dead

## Priority Levels

- **High**: Broken links on critical pages (homepage, main portals)
- **Medium**: Broken links on services, blogs, calculators
- **Low**: Broken links on archives, old content

## AI Provider

**Model**: Google Gemini 2.5 Flash (via Lovable AI)
- No API key required
- Fast response times
- Good at content similarity analysis
- Understands web structure and SEO

## Implementation Status

✅ **Completed**:
- Database schema
- Edge function for crawling and AI analysis
- Admin dashboard with review interface
- Priority rankings
- Confidence scoring
- Status tracking (pending/approved/rejected)

🚧 **To-Do**:
- Actual page crawling (currently simulated)
- Redirect implementation layer
- Apply approved redirects automatically
- External link checking
- Scheduled weekly runs (cron job)
- Email notifications for critical broken links

## Next Steps

1. **Implement Real Crawling**: Replace simulation with actual HTTP requests to crawl pages
2. **Redirect Handler**: Create edge function or Vite config to apply approved redirects
3. **Automation**: Set up weekly cron job for automatic analysis
4. **Notifications**: Alert admins when high-priority broken links are found
5. **External Links**: Add support for checking external link health
6. **Link Validation**: Implement pre-publish broken link detection

## Configuration

### Pages to Crawl

Edit `PAGES_TO_CRAWL` in `supabase/functions/ai-broken-links/index.ts` to add/remove pages:

```typescript
const PAGES_TO_CRAWL = [
  { url: '/', priority: 'high', name: 'Homepage' },
  { url: '/services', priority: 'high', name: 'Services Page' },
  // Add more pages here
];
```

### AI Prompt

The AI analysis prompt can be customized in the edge function to:
- Adjust redirect suggestion criteria
- Change confidence thresholds
- Modify reasoning style
- Add site-specific context

## Architecture Notes

- **Separation of Concerns**: Crawling, AI analysis, and UI are decoupled
- **Scalability**: Can handle hundreds of pages via batch processing
- **Extensibility**: Easy to add new error types, priority levels, or redirect strategies
- **Security**: RLS policies ensure only authenticated users can view/approve
- **Auditability**: Complete history of all analyses and decisions

## Related Modules

- **AI SEO Refresh**: Optimizes meta tags and content
- **Performance Auditor**: (To be implemented) Lighthouse scoring
- **Error Log Analyzer**: (To be implemented) Backend error tracking
- **AI Content Pipeline**: (To be implemented) Content suggestions
- **Site Health Copilot**: (To be implemented) AI assistant for all modules

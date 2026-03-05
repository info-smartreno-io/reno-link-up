# AI Performance Auditor (Lighthouse)

## Overview

The AI Performance Auditor automatically runs Lighthouse-style performance audits on key SmartReno pages, analyzes Core Web Vitals metrics (LCP, FID, CLS), and uses AI to suggest actionable optimizations like image compression, code splitting, and caching strategies.

## Components

### 1. Database Tables

#### `ai_performance_reports`
Tracks each performance audit run:
- `id` - Unique report identifier
- `created_at` - When audit started
- `completed_at` - When audit finished
- `status` - running | completed | failed
- `pages_audited` - Number of pages analyzed
- `average_performance_score` - Overall Lighthouse performance score (0-1)
- `average_accessibility_score` - Overall accessibility score (0-1)
- `average_seo_score` - Overall SEO score (0-1)
- `average_best_practices_score` - Overall best practices score (0-1)
- `issues_found` - Total optimization opportunities identified

#### `ai_performance_audits`
Stores individual page performance audits:
- `id` - Unique audit identifier
- `report_id` - Links to parent report
- `page_url` - The page path audited
- `page_name` - Human-readable page name
- `performance_score` - Lighthouse performance score (0-1)
- `accessibility_score` - Accessibility score (0-1)
- `seo_score` - SEO score (0-1)
- `best_practices_score` - Best practices score (0-1)
- **Core Web Vitals:**
  - `lcp_value` - Largest Contentful Paint (ms) - target: <2500ms
  - `fid_value` - First Input Delay (ms) - target: <100ms
  - `cls_value` - Cumulative Layout Shift - target: <0.1
- **Additional Metrics:**
  - `fcp_value` - First Contentful Paint (ms)
  - `ttfb_value` - Time to First Byte (ms)
  - `tti_value` - Time to Interactive (ms)
- `ai_summary` - AI-generated performance summary
- `priority` - high | medium | low

#### `ai_performance_recommendations`
Stores AI-suggested optimizations:
- `id` - Unique recommendation identifier
- `audit_id` - Links to specific page audit
- `recommendation_type` - Type of optimization:
  - `image_optimization` - WebP conversion, lazy loading, responsive images
  - `code_splitting` - Bundle optimization, dynamic imports
  - `caching` - Browser caching, CDN strategies
  - `lazy_loading` - Defer non-critical resources
  - `minification` - CSS/JS compression
  - `server_response_time` - Backend optimization
  - `render_blocking` - Critical CSS, async/defer scripts
  - `unused_javascript` - Remove dead code
  - `unused_css` - Purge unused styles
  - `font_optimization` - Font subsetting, preloading
  - `third_party_scripts` - Optimize external dependencies
- `title` - Short recommendation title
- `description` - Detailed explanation
- `impact` - high | medium | low
- `estimated_improvement` - Expected performance gain (e.g., "Reduce LCP by 1.2s")
- `implementation_notes` - How to implement the fix
- `status` - pending | in_progress | completed | dismissed
- `completed_at` - When optimization was applied
- `completed_by` - User who completed it

### 2. Edge Function

**Location**: `supabase/functions/ai-performance-audit/index.ts`

**What it does**:
1. Audits predefined pages (homepage, portals, calculators, cost guides)
2. Collects Lighthouse-style performance metrics
3. Measures Core Web Vitals (LCP, FID, CLS)
4. Uses Lovable AI (Google Gemini 2.5 Flash) to analyze results
5. AI generates optimization recommendations with:
   - Specific implementation steps
   - Impact assessment
   - Estimated performance improvements
6. Stores audits and recommendations in database

**Current Implementation**:
- Simulates Lighthouse audits (production would call Google PageSpeed Insights API)
- Generates realistic performance metrics
- AI analyzes patterns and suggests optimizations

**Invocation**:
```typescript
await supabase.functions.invoke('ai-performance-audit');
```

### 3. Admin Dashboard

**Location**: `src/pages/AdminAI.tsx` (Performance Tab)

**Features**:
- **Run Audit**: Trigger new performance analysis
- **View Reports**: History of all performance audits
- **Detailed Audits**: 
  - View individual page scores
  - See Lighthouse category scores (Performance, Accessibility, SEO, Best Practices)
  - Monitor Core Web Vitals with color-coded indicators
  - Read AI-generated summaries
- **Optimization Recommendations**:
  - View AI-suggested improvements
  - See impact levels (high/medium/low)
  - Track estimated performance gains
  - Implementation guidance
  - Status tracking (pending/in progress/completed/dismissed)
- **Visual Indicators**:
  - Color-coded scores (green: >90%, yellow: 50-90%, red: <50%)
  - Core Web Vitals pass/fail indicators
  - Priority badges

## Usage

### Running Performance Audit

1. Navigate to `/admin/ai` in admin portal
2. Click the "Performance Auditor" tab
3. Click "Run Performance Audit" button
4. Wait for analysis to complete (usually 20-40 seconds)
5. Review overall scores and page-by-page results

### Analyzing Results

**Overall Metrics (Report Level)**:
- Average scores across all pages
- Breakdown by Lighthouse categories
- Total optimization opportunities

**Page-Level Analysis**:
- Individual page Lighthouse scores
- Core Web Vitals measurements
- AI-generated performance summary
- Click any page to see detailed recommendations

**Recommendations**:
- AI-suggested optimizations ordered by impact
- Estimated performance improvements
- Implementation guidance
- Action buttons to track progress

### Taking Action

1. **Review**: Read AI recommendation and impact assessment
2. **Start Work**: Mark recommendation as "in progress"
3. **Implement**: Follow implementation notes
4. **Complete**: Mark as completed when done
5. **Verify**: Run new audit to measure improvements

## Core Web Vitals Explained

### LCP (Largest Contentful Paint)
- **What**: Time until largest content element is visible
- **Target**: <2.5 seconds
- **Common Causes**: Large images, slow servers, render-blocking resources
- **Fixes**: Image optimization, CDN, code splitting

### FID (First Input Delay)
- **What**: Time from user interaction to browser response
- **Target**: <100 milliseconds
- **Common Causes**: Heavy JavaScript, long tasks
- **Fixes**: Code splitting, defer non-critical JS, web workers

### CLS (Cumulative Layout Shift)
- **What**: Visual stability - unexpected layout shifts
- **Target**: <0.1
- **Common Causes**: Images without dimensions, dynamic content insertion
- **Fixes**: Set image dimensions, reserve space for ads, use CSS transforms

## Optimization Types

### High Impact
- **Image Optimization**: WebP conversion, responsive images, lazy loading
- **Code Splitting**: Bundle analysis, dynamic imports, tree shaking
- **Render Blocking**: Critical CSS inlining, async/defer scripts

### Medium Impact
- **Caching**: Browser caching, service workers, CDN configuration
- **Minification**: CSS/JS compression, remove whitespace
- **Server Response**: Backend optimization, database queries

### Low Impact
- **Font Optimization**: Font subsetting, preloading, variable fonts
- **Third-Party Scripts**: Defer analytics, optimize tag managers
- **Unused Code**: Dead code elimination, CSS purging

## AI Provider

**Model**: Google Gemini 2.5 Flash (via Lovable AI)
- No API key required
- Fast analysis of performance data
- Contextual optimization suggestions
- Understands web performance best practices

## Implementation Status

✅ **Completed**:
- Database schema with performance metrics
- Edge function for auditing and AI analysis
- Admin dashboard with detailed visualizations
- Core Web Vitals tracking
- Lighthouse score categories
- AI-powered recommendation system
- Status tracking (pending/in progress/completed)

🚧 **To-Do**:
- Real Lighthouse integration (PageSpeed Insights API)
- Historical trend charts
- Performance budget alerts
- Automated weekly audits (cron job)
- Before/after comparison views
- Export audit reports as PDF
- Slack/email notifications for regressions

## Integration with PageSpeed Insights (Production)

To implement real Lighthouse audits:

```typescript
// Replace simulateLighthouseAudit() with:
async function runLighthouseAudit(pageUrl: string) {
  const API_KEY = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
  const fullUrl = `https://smartreno.io${pageUrl}`;
  
  const response = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fullUrl)}&key=${API_KEY}&category=performance&category=accessibility&category=seo&category=best-practices`
  );
  
  const data = await response.json();
  const lighthouse = data.lighthouseResult;
  
  return {
    performanceScore: lighthouse.categories.performance.score,
    accessibilityScore: lighthouse.categories.accessibility.score,
    seoScore: lighthouse.categories.seo.score,
    bestPracticesScore: lighthouse.categories['best-practices'].score,
    lcpValue: lighthouse.audits['largest-contentful-paint'].numericValue,
    fidValue: lighthouse.audits['max-potential-fid'].numericValue,
    clsValue: lighthouse.audits['cumulative-layout-shift'].numericValue,
    // ... additional metrics
  };
}
```

## Architecture Notes

- **Separation of Concerns**: Auditing, AI analysis, and UI are decoupled
- **Scalability**: Can handle hundreds of pages via batch processing
- **Extensibility**: Easy to add new metric types or optimization categories
- **Real-time Updates**: Uses React Query for live data synchronization
- **Auditability**: Complete history of all audits and optimizations

## Related Modules

- **AI SEO Refresh**: Optimizes meta tags and content
- **Broken Link Manager**: Detects and fixes broken links
- **Error Log Analyzer**: (To be implemented) Backend error tracking
- **AI Content Pipeline**: (To be implemented) Content suggestions
- **Site Health Copilot**: (To be implemented) AI assistant for all modules

## Best Practices

1. **Run Audits Regularly**: Weekly audits catch performance regressions early
2. **Prioritize High-Impact Fixes**: Focus on high-impact recommendations first
3. **Monitor Trends**: Track performance scores over time
4. **Set Performance Budgets**: Define acceptable thresholds for each metric
5. **Test Changes**: Run new audit after implementing optimizations
6. **Mobile-First**: Core Web Vitals are especially important on mobile
7. **Iterative Improvements**: Small, consistent improvements compound over time

## Performance Budget Guidelines

**Lighthouse Scores** (Target: >90%):
- Performance: >90% (good), 50-90% (needs improvement), <50% (poor)
- Accessibility: >90% (good), 80-90% (fair), <80% (poor)
- SEO: >90% (good), 80-90% (fair), <80% (poor)
- Best Practices: >90% (good), 80-90% (fair), <80% (poor)

**Core Web Vitals**:
- LCP: <2.5s (good), 2.5-4s (needs improvement), >4s (poor)
- FID: <100ms (good), 100-300ms (needs improvement), >300ms (poor)
- CLS: <0.1 (good), 0.1-0.25 (needs improvement), >0.25 (poor)

**Page Load Metrics**:
- FCP: <1.8s (good), 1.8-3s (fair), >3s (poor)
- TTI: <3.8s (good), 3.8-7.3s (fair), >7.3s (poor)
- TTFB: <600ms (good), 600-1800ms (fair), >1800ms (poor)

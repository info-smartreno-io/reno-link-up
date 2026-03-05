# SmartReno SEO/Analytics/Security Implementation

## Overview

This document describes the SEO, analytics, and security foundation implemented for SmartReno on the Vite/React Router stack. The implementation is designed to be **portable and framework-agnostic** where possible, allowing for future migration to Next.js or other frameworks.

## 1. SEO Foundation

### 1.1 SEO Utilities (`src/utils/seo.ts`)

Framework-agnostic utility functions for building SEO metadata:

**Key Functions:**
- `buildTitle()` - Creates location-aware page titles
- `buildDescription()` - Generates meta descriptions with location context
- `buildCanonical()` - Constructs canonical URLs
- `buildMetadata()` - Comprehensive metadata object generator
- `generateBreadcrumbList()` - JSON-LD breadcrumb schema

**County Data:**
Contains SEO data for all 5 Northern NJ counties (Bergen, Passaic, Morris, Essex, Hudson) with descriptions and keywords.

**Usage Example:**
```typescript
import { buildMetadata, COUNTY_SEO_DATA } from "@/utils/seo";

const metadata = buildMetadata(
  "Kitchen Renovation Services",
  "/services/kitchen",
  { county: "Bergen County", town: "Ridgewood" }
);
```

### 1.2 JSON-LD Structured Data (`src/components/seo/JsonLd.tsx`)

Reusable React components for schema.org markup:

**Available Schemas:**
- `<OrganizationSchema />` - Site-wide organization data
- `<LocalBusinessSchema />` - Local business with county support
- `<FAQSchema />` - FAQ pages
- `<ServiceSchema />` - Service pages
- `<ArticleSchema />` - Blog posts

**Implementation:**
```tsx
import { LocalBusinessSchema, FAQSchema } from "@/components/seo/JsonLd";

<LocalBusinessSchema county="Bergen County" priceRange="$$$" />
<FAQSchema items={faqData} />
```

### 1.3 Meta Tags with react-helmet-async

All pages use `react-helmet-async` for dynamic meta tags:

```tsx
import { Helmet } from "react-helmet-async";

<Helmet>
  <title>{metadata.title}</title>
  <meta name="description" content={metadata.description} />
  <link rel="canonical" href={metadata.canonical} />
  <meta property="og:title" content={metadata.title} />
  <meta property="og:description" content={metadata.description} />
</Helmet>
```

### 1.4 Dynamic Sitemap

The sitemap is generated at build time via `scripts/generateSitemap.ts` and includes:

- Static pages (home, about, careers, etc.)
- County pages (/locations/bergen, /locations/passaic, etc.)
- Blog posts (dynamic from `src/data/blogPosts.ts`)
- Blog categories

**To regenerate:**
```bash
npx tsx scripts/generateSitemap.ts
```

**Future Enhancement:** Add town-specific pages (e.g., `/locations/bergen/ridgewood`)

## 2. Analytics Integration

### 2.1 Google Analytics 4 + Google Tag Manager (`src/utils/analytics.ts`)

**Initialization:**
- GA4 and GTM are initialized in `src/main.tsx` (production only)
- Automatic dataLayer setup for GTM
- Page view tracking on every route change

**Configuration:**
Replace these IDs in `src/utils/analytics.ts`:
```typescript
export const GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"; // Your GA4 ID
export const GTM_ID = "GTM-XXXXXXX"; // Your GTM ID
```

### 2.2 Event Tracking

**SmartReno-specific events:**

| Event | Function | Purpose |
|-------|----------|---------|
| `estimate_start` | `trackEstimateStart()` | User begins estimate flow |
| `estimate_step` | `trackEstimateStep()` | Progress through estimate steps |
| `estimate_completed` | `trackEstimateCompleted()` | Estimate form submitted |
| `calculator_used` | `trackCalculatorUsed()` | Cost calculator interaction |
| `form_submit` | `trackFormSubmission()` | Generic form submission |
| `professional_signup` | `trackProfessionalSignup()` | Contractor/architect signup |
| `bid_viewed` | `trackBidViewed()` | Bid opportunity viewed |
| `bid_submitted` | `trackBidSubmitted()` | Bid submitted |
| `blog_post_view` | `trackBlogPostView()` | Blog post read |
| `cta_click` | `trackCTAClick()` | CTA button clicked |
| `contact_click` | `trackContactClick()` | Phone/email clicked |
| `login`/`sign_up` | `trackUserLogin()` / `trackUserSignup()` | Authentication events |

**Usage Example:**
```typescript
import { trackEstimateStart, trackCTAClick } from "@/utils/analytics";

// Track estimate start
trackEstimateStart("kitchen remodel", "Bergen County");

// Track CTA click
trackCTAClick("Get Free Estimate", "hero-section", "/get-estimate");
```

### 2.3 Automatic Page View Tracking

The `usePageTracking()` hook automatically tracks page views:

```typescript
// In App.tsx
import { usePageTracking } from "@/hooks/usePageTracking";

function AppRoutes() {
  usePageTracking(); // Tracks every route change
  // ...
}
```

### 2.4 GTM Setup in Google Tag Manager

**Recommended Tags:**
1. **GA4 Configuration Tag** - Fires on all pages
2. **Page View Tag** - Triggers on `page_view` event
3. **Custom Event Tags** - For estimate_completed, bid_submitted, etc.
4. **Conversion Tags** - For key actions (estimate submissions, signups)

**Variables to create:**
- `event` (built-in)
- `project_type` (Data Layer Variable)
- `location` (Data Layer Variable)
- `user_type` (Data Layer Variable)

## 3. Security Hardening

### 3.1 Input Validation (`src/utils/security.ts`)

**Zod Schemas:**
All forms use Zod validation schemas for type-safe validation:

```typescript
import { contactFormSchema, estimateRequestSchema } from "@/utils/security";

const result = contactFormSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

**Available Schemas:**
- `emailSchema` - Email validation
- `phoneSchema` - US phone number format
- `nameSchema` - Name with character restrictions
- `addressSchema` - Address validation
- `messageSchema` - Message/description with length limits
- `zipCodeSchema` - US zip code format
- `contactFormSchema` - Complete contact form
- `estimateRequestSchema` - Estimate request form
- `contractorApplicationSchema` - Contractor application

### 3.2 Rate Limiting

In-memory rate limiter (upgrade to Redis for production):

```typescript
import { checkRateLimit } from "@/utils/security";

const { allowed, message } = checkRateLimit(
  userIdentifier, // IP address or user ID
  "estimate_request",
  10, // Max 10 requests
  60000 // Per 60 seconds
);

if (!allowed) {
  // Block request
}
```

**Default Limits:**
- 10 requests per minute (general)
- Customize per action

### 3.3 Content Sanitization

**Functions:**
- `sanitizeHtml()` - Remove scripts and dangerous attributes
- `sanitizeInput()` - Clean user input for display
- `sanitizeUrlParam()` - Validate URL parameters

**Usage:**
```typescript
import { sanitizeInput, sanitizeUrlParam } from "@/utils/security";

const cleanInput = sanitizeInput(userInput);
const safeParam = sanitizeUrlParam(searchParams.get("query"));
```

### 3.4 Security Headers

Recommended security headers (configure in your hosting platform):

```typescript
import { SECURITY_HEADERS } from "@/utils/security";

// Headers already defined - apply them in:
// - Vite config (dev)
// - Netlify/Vercel headers file (production)
```

**Headers included:**
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

## 4. Implementation Checklist

### Immediate Actions

- [ ] **Replace GA4 ID** in `src/utils/analytics.ts`
- [ ] **Replace GTM ID** in `src/utils/analytics.ts`
- [ ] **Set up GTM container** with tags and triggers
- [ ] **Configure security headers** in hosting platform
- [ ] **Test event tracking** in GA4 Real-Time view

### Page-by-Page SEO

For each page, ensure:

- [ ] Unique `<title>` with primary keyword
- [ ] Meta description (150-160 chars)
- [ ] Canonical URL
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Appropriate JSON-LD schema
- [ ] H1 matches primary intent
- [ ] Semantic HTML structure
- [ ] Image alt attributes

### Analytics Events

Add tracking to:

- [ ] Estimate form (start, steps, completion)
- [ ] Cost calculator interactions
- [ ] Professional signups
- [ ] Bid submissions and views
- [ ] Blog post views
- [ ] CTA clicks
- [ ] Contact clicks (phone/email)
- [ ] Search functionality
- [ ] Error tracking

### Security

- [ ] Add input validation to all forms
- [ ] Implement rate limiting on public endpoints
- [ ] Sanitize user-generated content
- [ ] Configure CSP headers
- [ ] Enable HTTPS redirect
- [ ] Add CSRF protection for state-changing operations

## 5. Monitoring & Optimization

### Google Search Console

1. Submit `sitemap.xml` to GSC
2. Monitor index coverage
3. Track keyword rankings
4. Fix crawl errors

### Google Analytics 4

**Key Reports:**
- **Acquisition** → Traffic sources
- **Engagement** → Page views and events
- **Conversions** → Estimate completions, signups
- **User Attributes** → Location, device type

**Custom Dimensions to Create:**
- Project Type
- County/Location
- User Type (homeowner, contractor, etc.)

### Performance

**Tools:**
- Google PageSpeed Insights
- Lighthouse CI
- GTmetrix

**Targets:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Mobile-friendly score: 100%

## 6. Portability Notes

The implementation is designed to be framework-agnostic:

**Portable Components:**
- `src/utils/seo.ts` - Pure TypeScript, works anywhere
- `src/utils/analytics.ts` - Pure TypeScript, works anywhere
- `src/utils/security.ts` - Pure TypeScript with Zod
- `src/components/seo/JsonLd.tsx` - React component, easy to port

**React-Specific:**
- `usePageTracking` hook (can be replaced with router-specific hooks in Next.js)
- `react-helmet-async` (Next.js uses `next/head` or App Router metadata)

**Migration to Next.js:**
1. Copy utility files as-is
2. Replace `react-helmet-async` with Next.js metadata API
3. Replace `usePageTracking` with Next.js router events
4. Move JSON-LD to layout or page files
5. Use Next.js `sitemap.ts` API instead of build script

## 7. Resources

**Documentation:**
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Google Tag Manager](https://tagmanager.google.com/)
- [Schema.org](https://schema.org/)
- [Zod Validation](https://zod.dev/)

**Monitoring:**
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics 4](https://analytics.google.com/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)

## 8. Next Steps

**Short-term:**
1. Complete GA4/GTM setup with actual IDs
2. Add event tracking to remaining forms and interactions
3. Enhance sitemap with town-level pages
4. Set up conversion goals in GA4
5. Configure security headers in production

**Long-term:**
1. A/B test CTA messaging
2. Expand JSON-LD schemas (How-To, FAQs per page)
3. Implement breadcrumb structured data site-wide
4. Consider Next.js migration for improved SEO features
5. Add image sitemaps for better image SEO

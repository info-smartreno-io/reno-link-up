# SmartReno Analytics Implementation Guide

## Overview

SmartReno uses **Google Tag Manager (GTM)** and **Google Analytics 4 (GA4)** for comprehensive analytics tracking across the website.

## Setup Instructions

### 1. Replace Placeholder IDs

Update the following files with your actual tracking IDs:

**In `index.html`:**
```html
<!-- Line 20-25: Replace GTM-XXXXXXX with your GTM container ID -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

**In `src/utils/analytics.ts`:**
```typescript
// Lines 7-8: Replace with your actual IDs
export const GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"; // Your GA4 Measurement ID
export const GTM_ID = "GTM-XXXXXXX"; // Your GTM Container ID
```

### 2. Create GTM Container

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Create a new container for `smartreno.io`
3. Select "Web" as the target platform
4. Copy your GTM container ID (format: `GTM-XXXXXXX`)

### 3. Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for SmartReno
3. Create a data stream for `smartreno.io`
4. Copy your Measurement ID (format: `G-XXXXXXXXXX`)

### 4. Configure GTM Tags

In your GTM container, create the following tags:

#### GA4 Configuration Tag
- **Tag Type**: Google Analytics: GA4 Configuration
- **Measurement ID**: Your GA4 ID
- **Trigger**: All Pages

#### GA4 Event Tags
Create event tags for:
- `page_view`
- `homepage_cta_click`
- `town_page_cta_click`
- `scroll_depth`
- `estimate_start`
- `estimate_completed`
- `form_submit`

## Events Tracked

### Homepage Events

| Event Name | When Fired | Parameters |
|------------|-----------|------------|
| `homepage_cta_click` | CTA button clicked on homepage | `cta_type`, `cta_location` |
| `scroll_depth` | User scrolls 25%, 50%, 75%, 100% | `scroll_percentage`, `page_path` |

### Town Page Events

| Event Name | When Fired | Parameters |
|------------|-----------|------------|
| `town_page_view` | Town page loaded | `town_name`, `county_name` |
| `town_page_cta_click` | CTA clicked on town page | `town_name`, `county_name`, `cta_location` |

### Estimate Flow Events

| Event Name | When Fired | Parameters |
|------------|-----------|------------|
| `estimate_start` | User begins estimate | `project_type`, `location` |
| `estimate_step` | User completes a step | `step_number`, `step_name` |
| `estimate_completed` | Estimate submitted | `projectType`, `location`, `estimatedValue` |

### Form Events

| Event Name | When Fired | Parameters |
|------------|-----------|------------|
| `form_submit` | Any form submitted | `form_name`, form-specific data |
| `contact_click` | Phone/email clicked | `contact_type`, `click_location` |

### Professional Events

| Event Name | When Fired | Parameters |
|------------|-----------|------------|
| `professional_signup` | Professional account created | `user_type` |
| `bid_viewed` | Contractor views bid | `bid_id`, `project_type` |
| `bid_submitted` | Contractor submits bid | `bid_id`, `bid_amount` |

### Content Events

| Event Name | When Fired | Parameters |
|------------|-----------|------------|
| `blog_post_view` | Blog post viewed | `post_slug`, `post_category`, `tags` |
| `search` | Search performed | `search_term`, `results_count` |

## Using Analytics in Code

### Import the utilities:

```typescript
import { 
  trackEvent, 
  trackHomepageCTA, 
  trackTownPageCTA,
  trackEstimateStart,
  trackFormSubmission
} from '@/utils/analytics';
```

### Track CTA clicks:

```typescript
<Button 
  onClick={() => trackHomepageCTA('Get Estimate', 'hero')}
>
  Get Free Estimate
</Button>
```

### Track form submissions:

```typescript
const handleSubmit = (data) => {
  trackFormSubmission('estimate_request', {
    project_type: data.projectType,
    zip_code: data.zipCode
  });
  // ... submit form
};
```

### Track custom events:

```typescript
trackEvent('custom_event_name', {
  parameter1: 'value1',
  parameter2: 'value2',
  category: 'Engagement'
});
```

## Scroll Depth Tracking

Scroll depth is automatically tracked on the homepage using the `useScrollTracking` hook:

```typescript
import { useScrollTracking } from '@/hooks/useScrollTracking';

function HomePage() {
  useScrollTracking(); // Tracks 25%, 50%, 75%, 100% scroll
  // ...
}
```

## Testing

### Verify GTM Installation:

1. Install [Google Tag Assistant](https://tagassistant.google.com/)
2. Visit your site
3. Check that GTM container is firing
4. Verify tags are triggering correctly

### Test Events in GA4:

1. Go to GA4 > Configure > DebugView
2. Perform actions on your site
3. Verify events appear in real-time

### Debug DataLayer:

Open browser console and type:
```javascript
window.dataLayer
```

You should see an array of events.

## Key Performance Indicators (KPIs)

Track these metrics in GA4:

### Conversion Funnel
1. Homepage visits
2. Estimate flow starts (`estimate_start`)
3. Estimate flow completions (`estimate_completed`)
4. Conversion rate: completions / starts

### SEO Performance
1. Town page views by location
2. Organic traffic to town pages
3. Town page → estimate conversion rate

### Engagement
1. Average scroll depth
2. CTA click-through rates
3. Time on page by page type

### Forms
1. Form submission rate
2. Form abandonment rate
3. Most popular form types

## Troubleshooting

### GTM not loading?
- Check browser console for errors
- Verify GTM ID is correct in both `index.html` and `analytics.ts`
- Check ad blockers aren't blocking GTM

### Events not firing?
- Check `window.dataLayer` in console
- Verify event names match GTM triggers
- Use GTM Preview mode to debug

### GA4 not receiving data?
- Verify Measurement ID is correct
- Check GA4 Configuration tag is firing
- Allow 24-48 hours for data to appear in standard reports

## Production Checklist

- [ ] Replace `GTM-XXXXXXX` with actual GTM container ID
- [ ] Replace `G-XXXXXXXXXX` with actual GA4 Measurement ID
- [ ] Create and publish GTM container with all tags
- [ ] Verify GTM installation with Tag Assistant
- [ ] Test key events in GA4 DebugView
- [ ] Set up conversion goals in GA4
- [ ] Configure custom reports for KPIs
- [ ] Set up automated alerts for critical metrics
- [ ] Document custom dimensions/metrics for team

## Support

For analytics questions, contact the SmartReno marketing team or refer to:
- [GTM Documentation](https://support.google.com/tagmanager)
- [GA4 Documentation](https://support.google.com/analytics)

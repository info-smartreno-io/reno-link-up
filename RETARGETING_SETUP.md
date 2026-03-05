# SmartReno Retargeting & Conversion Tracking System

## Overview

Complete implementation of Facebook Pixel, TikTok Pixel, and Google Ads tracking for retargeting and conversion optimization.

## Features Implemented

### 1. Conversion Event Tracking
- **Page Views**: Track all page navigation
- **Intake Events**: Track funnel progression (start, steps, complete)
- **Quote Requests**: Track conversion events
- **Contractor Signups**: Track professional conversions
- **Attribution Data**: Full UTM and lead source tracking

### 2. Retargeting Pixels
- **Facebook Pixel**: Full event tracking and custom conversions
- **TikTok Pixel**: Page views and conversion events
- **Google Ads**: Conversion tracking and remarketing

### 3. Audience Segmentation
- **Abandoned Intake**: Users who started but didn't complete
- **Viewed Pricing**: Users who viewed cost guides
- **Viewed Contractor Directory**: Professional interest signal
- **Custom Audiences**: Flexible criteria-based targeting

### 4. Admin Dashboard
- **Pixel Configuration**: Easy setup for all tracking pixels
- **Conversion Stats**: Real-time funnel metrics
- **Audience Management**: Create and manage retargeting segments
- **ROI Tracking**: Conversion value and attribution

## Setup Instructions

### 1. Configure Tracking Pixels

In your admin dashboard (`/admin/retargeting`):

1. Enter your pixel IDs:
   - Facebook Pixel ID (e.g., `123456789012345`)
   - TikTok Pixel ID (e.g., `ABCDEFGHIJK`)
   - Google Ads ID (e.g., `AW-123456789`)

2. Click "Initialize Pixels"

### 2. Environment Variables (Optional)

Add to your `.env.local` for automatic initialization:

```env
VITE_FB_PIXEL_ID=your_facebook_pixel_id
VITE_TIKTOK_PIXEL_ID=your_tiktok_pixel_id
VITE_GOOGLE_ADS_ID=your_google_ads_id
```

### 3. Wrap Your App

The `RetargetingProvider` is automatically initialized and tracks:
- Page views on route change
- Conversion events
- User identification

## Usage

### Track Custom Events

```typescript
import { useRetargetingTracking } from '@/hooks/useRetargetingTracking';

function MyComponent() {
  const { trackEvent, identifyUser } = useRetargetingTracking();

  const handleQuoteRequest = () => {
    trackEvent('quote_request', {
      eventCategory: 'homeowner',
      value: 150,
      contentName: 'Kitchen Remodel',
      contentCategory: 'Renovation',
    });
  };

  const handleUserSignup = (userData) => {
    identifyUser({
      email: userData.email,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      zipCode: userData.zipCode,
    });
  };

  return <button onClick={handleQuoteRequest}>Get Quote</button>;
}
```

### Predefined Event Types

- `page_view`: Automatic on route change
- `intake_start`: User begins project intake
- `intake_step`: User completes intake step
- `intake_complete`: User finishes intake
- `quote_request`: User requests quotes
- `contractor_signup`: Professional joins platform
- `add_payment_info`: Payment method added
- `search`: Search performed
- `view_content`: Content viewed

## Retargeting Audiences

### Pre-built Audiences

1. **Abandoned Intake** (7-day window)
   - Started intake form
   - Did not complete
   - High-intent leads

2. **Viewed Pricing** (14-day window)
   - Visited cost guide pages
   - Research phase
   - Educational content opportunity

3. **Viewed Contractor Directory** (14-day window)
   - Explored professional listings
   - Comparison shopping
   - Ready to hire signal

### Custom Audiences

Create custom audiences in the admin dashboard:

```typescript
{
  audience_name: "High-Value Projects",
  audience_type: "custom",
  criteria: {
    event_types: ["intake_complete"],
    min_conversion_value: 5000,
    time_window: "30d",
    exclude_event_types: ["quote_request"]
  }
}
```

## Conversion Funnel Analysis

### AI-Powered Optimization

The system includes an AI conversion optimizer that analyzes:
- Drop-off points in the funnel
- Conversion rate optimization opportunities
- Retargeting campaign recommendations
- Landing page improvements
- Audience segmentation strategies

Access via: `/admin/optimization` or edge function `ai-conversion-optimizer`

### Key Metrics Tracked

- **Page Views**: Total traffic
- **Intake Starts**: Funnel entry
- **Intake Completes**: Form completion
- **Quote Requests**: Final conversion
- **Conversion Rates**: Each funnel step
- **Attribution**: Source and campaign data
- **Value**: Revenue tracking

## Database Schema

### conversion_events Table

```sql
- id: UUID
- created_at: TIMESTAMPTZ
- event_type: TEXT (page_view, intake_start, etc.)
- event_category: TEXT (homeowner, contractor, content)
- user_id: UUID
- lead_id: UUID
- session_id: TEXT
- lead_source: TEXT
- utm_source, utm_medium, utm_campaign, utm_content, utm_term
- page_path, page_title, referrer
- conversion_value: DECIMAL
- metadata: JSONB
- fb_pixel_fired, tiktok_pixel_fired, google_ads_fired: BOOLEAN
```

### retargeting_audiences Table

```sql
- id: UUID
- audience_name: TEXT
- audience_type: TEXT
- description: TEXT
- criteria: JSONB (targeting rules)
- fb_audience_id, tiktok_audience_id, google_audience_id: TEXT
- estimated_size: INTEGER
- is_active: BOOLEAN
```

## Testing

Run retargeting tests:

```bash
npm test src/tests/integration/retargeting.test.tsx
```

## Troubleshooting

### Pixels Not Firing

1. Check browser console for errors
2. Verify pixel IDs are correct
3. Ensure pixels are initialized before page load
4. Check browser ad blockers

### Events Not Tracking

1. Verify RLS policies allow inserts
2. Check network tab for API calls
3. Verify Supabase connection
4. Check edge function logs

### Audience Size Not Updating

1. Audiences update when viewed in admin
2. Sync audiences with pixel platforms
3. Check criteria configuration

## Best Practices

1. **Value Tracking**: Always include conversion_value for ROI
2. **User Identification**: Identify users on signup for better matching
3. **Event Naming**: Use consistent event type strings
4. **Attribution**: Preserve UTM parameters throughout session
5. **Privacy**: Comply with GDPR/CCPA requirements

## Next Steps

1. Set up custom conversion events in Facebook Ads Manager
2. Create lookalike audiences from converters
3. Set up automated campaigns for abandoned intakes
4. A/B test landing pages for different audiences
5. Monitor conversion rates and optimize

## Support

For issues or questions about the retargeting system:
- Check admin dashboard for real-time stats
- Review AI optimization recommendations
- Monitor conversion events in database
- Test with browser dev tools

## Integration Complete

✅ Database tables created
✅ Tracking pixels integrated
✅ Conversion events logged
✅ Admin dashboard built
✅ AI optimization system deployed
✅ Tests implemented
✅ Documentation complete

Ready for production use!

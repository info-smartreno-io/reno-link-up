# Google Calendar Realtime Sync with Webhooks

The admin calendar now features **automatic realtime synchronization** with Google Calendar using Google's push notification webhooks. Changes made in Google Calendar are instantly reflected in SmartReno without manual syncing.

## How It Works

### 1. **Webhook Registration**
When you connect to Google Calendar, SmartReno automatically:
- Registers a webhook with Google Calendar API
- Stores the webhook details in the `google_calendar_webhooks` table
- Sets up a 7-day subscription (Google's maximum)

### 2. **Push Notifications**
When events change in Google Calendar, Google sends a notification to:
```
https://pscsnsgvfjcbldomnstb.supabase.co/functions/v1/google-calendar-webhook
```

The webhook handler:
- Verifies the notification is from Google
- Fetches updated events from your calendar
- Syncs them to the `walkthroughs` table
- Updates existing events or creates new ones

### 3. **Automatic Renewal**
Webhooks expire after 7 days. SmartReno automatically:
- Runs a cron job daily at 2 AM
- Checks for webhooks expiring in the next 24 hours
- Renews them before expiration
- Updates the database with new webhook details

### 4. **Realtime UI Updates**
The calendar component uses Supabase Realtime to:
- Listen for changes to the `walkthroughs` table
- Automatically refresh the calendar when data changes
- Show new/updated events without page refresh

## Features

✅ **Instant Sync**: Changes in Google Calendar appear immediately  
✅ **Bidirectional**: Works both ways - SmartReno → Google and Google → SmartReno  
✅ **Auto-Renewal**: Webhooks renewed automatically before expiration  
✅ **Error Recovery**: Continues working even if individual syncs fail  
✅ **Realtime UI**: Calendar updates without page refresh  

## Architecture

```
┌─────────────────┐
│ Google Calendar │
└────────┬────────┘
         │ Event Changes
         │ (webhook notification)
         ▼
┌─────────────────────────────┐
│ google-calendar-webhook     │ ◄── Edge Function
│ - Receives notifications    │
│ - Fetches updated events    │
│ - Syncs to walkthroughs DB  │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ walkthroughs table          │
│ - Stores calendar events    │
│ - Has RLS enabled           │
│ - Realtime enabled          │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Calendar Component          │
│ - Listens via Realtime      │
│ - Auto-refreshes on changes │
└─────────────────────────────┘
```

## Edge Functions

### 1. `google-calendar-webhook`
**Purpose**: Receives push notifications from Google Calendar  
**Method**: POST (called by Google)  
**Security**: Public endpoint (verified via Google headers)

**Headers from Google**:
- `x-goog-channel-id`: Unique channel identifier
- `x-goog-resource-state`: Event type (sync/exists/not_exists)
- `x-goog-resource-id`: Resource identifier

**Flow**:
1. Receives notification
2. Verifies it's a valid webhook
3. Fetches user's access token
4. Calls Google Calendar API for updated events
5. Syncs events to `walkthroughs` table

### 2. `google-calendar-register-webhook`
**Purpose**: Register a new webhook with Google Calendar  
**Method**: POST (called by frontend after OAuth)  
**Security**: Requires access token

**Request Body**:
```json
{
  "accessToken": "user_google_access_token",
  "userId": "user_uuid",
  "calendarId": "primary"
}
```

**Response**:
```json
{
  "success": true,
  "channelId": "smartreno-{userId}-{timestamp}",
  "resourceId": "google_resource_id",
  "expiration": "timestamp"
}
```

### 3. `google-calendar-renew-webhooks`
**Purpose**: Automatically renew expiring webhooks  
**Method**: POST (called by cron job)  
**Schedule**: Daily at 2 AM  
**Security**: Public (called by Supabase cron)

**Flow**:
1. Finds webhooks expiring in next 24 hours
2. Stops old webhook with Google
3. Registers new webhook
4. Updates database with new details

## Database Schema

### `google_calendar_webhooks` Table
```sql
CREATE TABLE google_calendar_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  channel_id TEXT NOT NULL UNIQUE,        -- Webhook channel ID
  resource_id TEXT NOT NULL,              -- Google resource ID
  calendar_id TEXT NOT NULL,              -- Calendar ID (usually "primary")
  expiration TIMESTAMPTZ NOT NULL,        -- When webhook expires
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Cron Job Setup

The webhook renewal cron job is configured in the database:

```sql
SELECT cron.schedule(
  'renew-google-calendar-webhooks',
  '0 2 * * *',  -- Daily at 2 AM
  $$ ... $$
);
```

To view active cron jobs:
```sql
SELECT * FROM cron.job;
```

To manually trigger renewal:
```sql
SELECT cron.schedule(
  'manual-renewal',
  '* * * * *',  -- Run immediately
  $$ ... $$
);
```

## Debugging

### Check Webhook Status
```sql
SELECT 
  w.*,
  u.email,
  EXTRACT(EPOCH FROM (w.expiration - NOW())) / 3600 as hours_until_expiry
FROM google_calendar_webhooks w
JOIN auth.users u ON u.id = w.user_id
ORDER BY expiration ASC;
```

### View Recent Sync Events
Check the edge function logs in Lovable Cloud dashboard for:
- `google-calendar-webhook`: Incoming notifications
- `google-calendar-renew-webhooks`: Renewal attempts

### Common Issues

**Webhooks not receiving notifications:**
- Verify webhook is registered: Check `google_calendar_webhooks` table
- Check expiration: Webhooks expire after 7 days
- Verify calendar permissions: Token must have calendar.events scope

**Events not syncing:**
- Check edge function logs for errors
- Verify access token is valid
- Ensure walkthroughs table RLS policies allow inserts

**Renewal failures:**
- Check if access tokens have expired
- Verify cron job is running: `SELECT * FROM cron.job`
- Check edge function logs for renewal errors

## Security

- ✅ Webhook endpoints verify Google headers
- ✅ Access tokens stored securely with RLS
- ✅ Each user can only access their own webhooks
- ✅ Service role key used for background jobs
- ✅ HTTPS enforced for all webhook endpoints

## Limitations

- Webhooks expire after 7 days (Google limitation)
- Push notifications may have slight delays (usually < 1 minute)
- Requires valid access token for renewal
- Limited to 10,000 webhooks per project (Google quota)

## Future Enhancements

- [ ] Support for multiple calendars per user
- [ ] Event deletion sync (currently only syncs new/updated)
- [ ] Custom sync intervals
- [ ] Webhook health monitoring dashboard
- [ ] Manual webhook re-registration button

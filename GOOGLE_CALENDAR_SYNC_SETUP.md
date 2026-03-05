# Google Calendar Two-Way Sync Setup

This guide explains how to set up automatic two-way synchronization between SmartReno and Google Calendar.

## Features

- **Automatic Push**: When you create or update events in SmartReno, they're automatically pushed to Google Calendar
- **Automatic Pull**: When events change in Google Calendar, they're automatically synced back to SmartReno
- **Real-time Webhooks**: Google Calendar sends notifications when events change
- **Selective Sync**: Choose which event types to sync (schedules, tasks, walkthroughs)

## Prerequisites

1. A Google Cloud project with Calendar API enabled
2. OAuth 2.0 credentials configured
3. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET stored in Supabase secrets

## Setup Instructions

### 1. Configure Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Go to OAuth consent screen and configure:
   - Add authorized domains: `<your-domain>.lovableproject.com` and your custom domain
   - Add scopes:
     - `.../auth/calendar.events`
     - `.../auth/calendar`
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`

### 2. Create OAuth 2.0 Credentials

1. Go to Credentials → Create Credentials → OAuth Client ID
2. Application type: Web application
3. Authorized JavaScript origins:
   - `https://<your-domain>.lovableproject.com`
   - Your custom domain (if applicable)
   - `http://localhost:5173` (for local development)
4. Authorized redirect URIs:
   - `https://<your-domain>.lovableproject.com/admin/calendars`
   - `https://<your-domain>.lovableproject.com/contractor/calendar`
   - Your custom domains with same paths
5. Copy the Client ID and Client Secret

### 3. Add Secrets to Lovable Cloud

1. Open the Backend dashboard
2. Go to Secrets
3. Add:
   - `GOOGLE_CLIENT_ID`: Your OAuth 2.0 Client ID
   - `GOOGLE_CLIENT_SECRET`: Your OAuth 2.0 Client Secret

### 4. Configure Site URL and Redirect URLs

The Site URL and Redirect URLs are automatically managed by Lovable Cloud. If you need to add custom domains:

1. Open the Backend dashboard
2. Go to Auth Settings
3. Add your custom domain to the redirect URLs

## How It Works

### Push Sync (SmartReno → Google Calendar)

When you create or update an event in SmartReno:
1. The event is saved to the SmartReno database
2. A database trigger fires
3. The event is automatically pushed to Google Calendar via API
4. The Google Calendar event ID is stored in SmartReno

### Pull Sync (Google Calendar → SmartReno)

When you create or update an event in Google Calendar:
1. Google Calendar sends a webhook notification
2. SmartReno receives the notification
3. SmartReno fetches the updated events from Google Calendar
4. Events are synced to SmartReno database

### Manual Sync

You can manually trigger a sync at any time:
1. Click the "Sync Now" button in the calendar interface
2. SmartReno fetches all events from Google Calendar
3. Events are merged with existing SmartReno events

## Event Types

The following event types can be synced:

- **Schedules**: Team member schedules and appointments
- **Tasks**: Foreman tasks with due dates
- **Walkthroughs**: Property walkthrough appointments

You can enable/disable sync for each event type in the sync settings.

## Webhook Registration

Webhooks are automatically registered when you connect Google Calendar:
- Webhook URL: `https://pscsnsgvfjcbldomnstb.supabase.co/functions/v1/google-calendar-webhook`
- Events monitored: All calendar changes
- Renewal: Webhooks are automatically renewed before expiration

## Troubleshooting

### Events not syncing from SmartReno to Google Calendar

1. Check that you're connected to Google Calendar (green indicator)
2. Verify auto-sync is enabled in settings
3. Check the event type is enabled for sync
4. Check console logs for errors

### Events not syncing from Google Calendar to SmartReno

1. Verify webhook is registered (check `google_calendar_webhooks` table)
2. Check webhook hasn't expired
3. Manually click "Sync Now" to force a pull
4. Check edge function logs for errors

### Connection expired

If your connection expires:
1. Click "Disconnect" in settings
2. Click "Connect" to reconnect
3. Authorize the application again

## Security Notes

- Access tokens are stored encrypted in the database
- Refresh tokens allow automatic token renewal
- Webhooks use secure channel verification
- Only authorized users can access their calendar data

## Support

For issues or questions, check:
- Edge function logs in Lovable Cloud dashboard
- Database tables: `google_calendar_tokens`, `google_calendar_webhooks`
- Google Calendar API quotas and limits

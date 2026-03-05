# Google Calendar Integration Setup

The admin calendar includes bidirectional sync with Google Calendar. Follow these steps to enable it:

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - Your production domain
   - Add Authorized redirect URIs:
     - `http://localhost:3000/admin/schedule`
     - `https://yourdomain.com/admin/schedule`
   - Click "Create"
   - Copy the **Client ID**

## 2. Configure Environment Variables

Add the Google Client ID to your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 3. Backend Secrets

The edge functions need the Google Client Secret. Add it through the Lovable Cloud dashboard:

1. Open your backend settings
2. Add a secret named `GOOGLE_CLIENT_SECRET`
3. Paste your Google Client Secret value

## 4. How It Works

### Features

- **Connect to Google Calendar**: Click "Connect Google Calendar" in the admin calendar
- **Push Events**: Create events in SmartReno and they sync to Google Calendar
- **Pull Events**: Click "Sync Google Calendar" to import events from Google
- **Automatic Token Refresh**: Tokens are stored securely and refreshed automatically
- **Team Calendars**: View and manage multiple team member calendars

### Event Syncing

**To Google Calendar:**
- Events created with "New Event" button are pushed to Google Calendar
- Includes title, description, location, start/end times, and attendees

**From Google Calendar:**
- Click "Sync Google Calendar" to pull recent events
- Events are imported into the walkthroughs table
- Duplicates are prevented using `google_calendar_event_id`

### Security

- OAuth tokens are stored in the `google_calendar_tokens` table
- Row Level Security (RLS) ensures users can only access their own tokens
- Access tokens expire after 1 hour and are automatically refreshed
- Refresh tokens are used to obtain new access tokens without re-authentication

## 5. Usage

1. Navigate to `/admin/schedule`
2. Click "Connect Google Calendar"
3. Authorize the application
4. You'll be redirected back to the calendar
5. Use "New Event" to create events (syncs to Google)
6. Use "Sync Google Calendar" to import events from Google

## Troubleshooting

**"Google Calendar is not configured"**
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in your `.env` file

**"Failed to connect to Google Calendar"**
- Check that your redirect URIs are correctly configured in Google Cloud Console
- Ensure the Google Calendar API is enabled

**Events not syncing**
- Check the browser console for errors
- Verify your access token hasn't expired
- Try disconnecting and reconnecting to Google Calendar

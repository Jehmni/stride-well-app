# Google OAuth Setup for Calendar Integration

This app now includes Google Calendar integration using OAuth 2.0. Each user can connect their own Google Calendar without requiring any backend setup.

## How It Works

- **No Backend Required**: The OAuth flow happens entirely in the browser
- **User-Specific**: Each user connects their own Google account
- **Secure**: Uses OAuth 2.0 with state parameter for CSRF protection
- **Privacy**: Users only access their own calendar data

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in app information:
   - App name: "Stride Well"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `https://www.googleapis.com/auth/calendar.events`
5. Add test users (optional for development)

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:8080/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
5. Copy the Client ID

### 4. Add to Environment Variables

Create or update your `.env` file:

```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

## User Experience

### For Users

1. **Click "Connect Google Calendar"** button
2. **Google OAuth popup opens** in a new window
3. **User logs into their Google account**
4. **User grants permission** to access their calendar
5. **Popup closes automatically** and returns to the app
6. **Success message appears** confirming connection
7. **Reminders automatically sync** to their Google Calendar

### Features

- ✅ **Automatic Sync**: New reminders automatically create calendar events
- ✅ **Real-time Updates**: Changes sync immediately
- ✅ **Recurring Events**: Handles daily, weekly, monthly patterns
- ✅ **Easy Disconnect**: Users can disconnect anytime
- ✅ **Privacy First**: No shared access between users

## Security Features

- **State Parameter**: CSRF protection using random state tokens
- **Popup Window**: Prevents clickjacking attacks
- **Session Storage**: Secure token storage
- **Automatic Cleanup**: Tokens cleared when popup closes

## Troubleshooting

### Common Issues

1. **"Popup blocked" error**
   - Allow popups for your domain
   - Check browser popup blocker settings

2. **"Invalid redirect URI" error**
   - Verify redirect URI in Google Cloud Console
   - Check for typos in the URI

3. **"OAuth consent screen" error**
   - Ensure OAuth consent screen is configured
   - Add your domain to authorized domains

4. **Calendar events not syncing**
   - Check if user is connected
   - Verify calendar permissions
   - Check browser console for errors

### Development vs Production

- **Development**: Use `http://localhost:8080` as redirect URI
- **Production**: Use your actual domain as redirect URI
- **HTTPS Required**: Production must use HTTPS for OAuth

## Code Structure

```
src/services/
├── googleAuthService.ts      # OAuth flow handling
├── calendarService.ts        # Calendar operations
└── notificationService.ts    # Reminder management

src/components/reminders/
└── EnhancedWorkoutReminders.tsx  # Main UI component

src/pages/
└── GoogleAuthCallback.tsx    # OAuth callback page
```

## Testing

1. **Test OAuth Flow**:
   - Click "Connect Google Calendar"
   - Complete Google login
   - Verify success message

2. **Test Calendar Sync**:
   - Create a reminder
   - Check Google Calendar for new event
   - Verify event details match

3. **Test Disconnect**:
   - Click "Disconnect" button
   - Verify connection status changes
   - Check that new reminders don't sync

## Future Enhancements

- [ ] **Outlook Calendar** integration
- [ ] **Apple Calendar** integration
- [ ] **Two-way sync** (calendar → app)
- [ ] **Calendar conflict detection**
- [ ] **Bulk import/export**

## Support

If you encounter issues:

1. Check browser console for error messages
2. Verify Google Cloud Console settings
3. Test with a different Google account
4. Check network tab for failed requests

The OAuth flow is designed to be robust and user-friendly while maintaining security best practices.

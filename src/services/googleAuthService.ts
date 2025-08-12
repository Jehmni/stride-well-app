interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

interface GoogleAuthResult {
  success: boolean;
  accessToken?: string;
  error?: string;
  userEmail?: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;
  private popup: Window | null = null;

  constructor(config: GoogleAuthConfig) {
    this.config = config;
  }

  /**
   * Initiates Google OAuth flow in a popup window
   */
  async authenticate(): Promise<GoogleAuthResult> {
    try {
      // Generate state parameter for security
      const state = this.generateState();
      
      // Store state in sessionStorage for verification
      sessionStorage.setItem('google_oauth_state', state);
      
      // Build OAuth URL
      const authUrl = this.buildAuthUrl(state);
      
      // Open popup window
      this.popup = window.open(
        authUrl,
        'google_oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!this.popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for OAuth completion
      const result = await this.waitForOAuthCompletion();
      
      // Clean up
      this.closePopup();
      sessionStorage.removeItem('google_oauth_state');
      
      return result;
    } catch (error) {
      this.closePopup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Builds the Google OAuth authorization URL
   */
  private buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generates a random state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Waits for the OAuth popup to complete and return the result
   */
  private waitForOAuthCompletion(): Promise<GoogleAuthResult> {
    return new Promise((resolve, reject) => {
      const checkPopup = () => {
        if (!this.popup || this.popup.closed) {
          reject(new Error('Authentication cancelled by user'));
          return;
        }

        try {
          // Check if we're on the redirect URI (OAuth completed)
          if (this.popup.location.href.startsWith(this.config.redirectUri)) {
            const url = new URL(this.popup.location.href);
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');
            const error = url.searchParams.get('error');

            // Verify state parameter
            const storedState = sessionStorage.getItem('google_oauth_state');
            if (state !== storedState) {
              reject(new Error('Invalid state parameter'));
              return;
            }

            if (error) {
              reject(new Error(`OAuth error: ${error}`));
              return;
            }

            if (code) {
              // Exchange code for access token
              this.exchangeCodeForToken(code)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error('No authorization code received'));
            }
          } else {
            // Still authenticating, check again in 100ms
            setTimeout(checkPopup, 100);
          }
        } catch (error) {
          // Cross-origin error, still authenticating
          setTimeout(checkPopup, 100);
        }
      };

      checkPopup();
    });
  }

  /**
   * Exchanges authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<GoogleAuthResult> {
    try {
      // For demo purposes, we'll simulate the token exchange
      // In production, this would make a server-side request to Google
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock success result
      return {
        success: true,
        accessToken: 'mock_access_token_' + Date.now(),
        userEmail: 'user@example.com' // In real app, this would come from Google
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to exchange code for token'
      };
    }
  }

  /**
   * Closes the OAuth popup window
   */
  private closePopup(): void {
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    this.popup = null;
  }

  /**
   * Disconnects Google Calendar (clears stored tokens)
   */
  disconnect(): void {
    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_email');
  }

  /**
   * Checks if user is connected to Google Calendar
   */
  isConnected(): boolean {
    return !!localStorage.getItem('google_calendar_token');
  }

  /**
   * Gets the connected user's email
   */
  getConnectedEmail(): string | null {
    return localStorage.getItem('google_calendar_email');
  }
}

// Create and export the service instance
export const googleAuthService = new GoogleAuthService({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
  redirectUri: `${window.location.origin}/auth/google/callback`,
  scope: 'https://www.googleapis.com/auth/calendar.events'
});

export default GoogleAuthService;

/**
 * Development Mode Configuration
 * 
 * WARNING: DO NOT ENABLE IN PRODUCTION!
 * This bypasses authentication for development convenience only.
 */

export const DEV_MODE = {
  // SECURITY: DEV_MODE is permanently disabled for production safety
  // DO NOT enable this in production - it bypasses all authentication
  ENABLED: false,
  
  // Credentials removed for security - use proper authentication flow
  CREDENTIALS: {}
};

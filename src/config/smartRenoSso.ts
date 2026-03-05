// SmartReno SSO Configuration
// When SmartReno provides their OAuth documentation, update these values

export const SMARTRENO_SSO_CONFIG = {
  // SSO Mode: 'mock' for development, 'live' when SmartReno provides credentials
  mode: 'mock' as 'mock' | 'live',
  
  // OAuth endpoints (to be provided by SmartReno)
  authorizationUrl: 'https://smartreno.example.com/oauth/authorize',
  tokenUrl: 'https://smartreno.example.com/oauth/token',
  userInfoUrl: 'https://smartreno.example.com/oauth/userinfo',
  
  // OAuth client credentials (to be stored in secrets when available)
  // clientId: process.env.SMARTRENO_CLIENT_ID,
  // clientSecret: process.env.SMARTRENO_CLIENT_SECRET,
  
  // Redirect after successful SSO login
  redirectAfterLogin: '/contractor/dashboard',
  
  // Scopes to request
  scopes: ['openid', 'profile', 'email', 'contractor'],
};

// Mock user data for development/testing
export const MOCK_SMARTRENO_USERS = [
  {
    id: 'sr-contractor-001',
    email: 'demo@allinonehome.com',
    password: 'demo123',
    name: 'All-In-One Demo Contractor',
    company: 'All-In-One Home Solutions',
    smartreno_id: 'SR-AIOH-001',
    role: 'contractor',
    permissions: ['view_projects', 'manage_leads', 'submit_bids'],
  },
  {
    id: 'sr-contractor-002',
    email: 'contractor@allinonehome.com',
    password: 'contractor123',
    name: 'John Smith',
    company: 'All-In-One Home Solutions',
    smartreno_id: 'SR-AIOH-002',
    role: 'contractor',
    permissions: ['view_projects', 'manage_leads', 'submit_bids', 'manage_team'],
  },
];

// Generate OAuth state for CSRF protection
export function generateOAuthState(): string {
  return crypto.randomUUID();
}

// Validate OAuth state
export function validateOAuthState(state: string, storedState: string): boolean {
  return state === storedState;
}

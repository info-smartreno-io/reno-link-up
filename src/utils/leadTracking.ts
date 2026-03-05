/**
 * Lead Tracking & Attribution Utilities
 * Tracks homeowner journey and attribution data
 */

import Cookies from 'js-cookie';

interface LeadTrackingData {
  // Attribution
  lead_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Marketing Attribution (new)
  source?: string;       // google, facebook, instagram, referral
  channel?: string;      // search, lsa, group, organic, ads
  sub_source?: string;   // FB group name, keyword, etc.
  gclid?: string;        // Google Click ID
  fbclid?: string;       // Facebook Click ID
  ad_group?: string;     // Google Ads ad group
  
  // Journey
  landing_page?: string;
  page_path?: string[];
  completed_steps?: string[];
  
  // Session
  session_id?: string;
  first_visit?: string;
  last_visit?: string;
  visit_count?: number;
}

const COOKIE_NAME = 'smartreno_tracking';
const COOKIE_EXPIRY = 30; // days

/**
 * Initialize tracking on first visit
 */
export function initializeTracking() {
  const existing = getTrackingData();
  
  if (!existing) {
    const urlParams = new URLSearchParams(window.location.search);
    const tracking: LeadTrackingData = {
      session_id: generateSessionId(),
      first_visit: new Date().toISOString(),
      last_visit: new Date().toISOString(),
      visit_count: 1,
      landing_page: window.location.pathname,
      page_path: [window.location.pathname],
      completed_steps: [],
      
      // Capture UTM parameters
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
      
      // Marketing attribution
      source: urlParams.get('source') || undefined,
      channel: urlParams.get('channel') || undefined,
      sub_source: urlParams.get('group') || urlParams.get('sub_source') || undefined,
      gclid: urlParams.get('gclid') || undefined,
      fbclid: urlParams.get('fbclid') || undefined,
      ad_group: urlParams.get('ad_group') || urlParams.get('adgroup') || undefined,
      
      // Determine lead source
      lead_source: determineLeadSource(urlParams),
    };
    
    saveTrackingData(tracking);
    return tracking;
  } else {
    // Update existing tracking
    const updated: LeadTrackingData = {
      ...existing,
      last_visit: new Date().toISOString(),
      visit_count: (existing.visit_count || 0) + 1,
    };
    
    saveTrackingData(updated);
    return updated;
  }
}

/**
 * Track page visit
 */
export function trackPageVisit(path: string) {
  const tracking = getTrackingData();
  
  if (tracking) {
    const pagePath = tracking.page_path || [];
    
    // Only add if it's a new path (not going back and forth)
    if (pagePath[pagePath.length - 1] !== path) {
      pagePath.push(path);
    }
    
    const updated: LeadTrackingData = {
      ...tracking,
      page_path: pagePath,
      last_visit: new Date().toISOString(),
    };
    
    saveTrackingData(updated);
  }
}

/**
 * Track completed intake step
 */
export function trackIntakeStep(step: string) {
  const tracking = getTrackingData();
  
  if (tracking) {
    const steps = tracking.completed_steps || [];
    
    if (!steps.includes(step)) {
      steps.push(step);
    }
    
    const updated: LeadTrackingData = {
      ...tracking,
      completed_steps: steps,
    };
    
    saveTrackingData(updated);
  }
}

/**
 * Get tracking data from cookie
 */
export function getTrackingData(): LeadTrackingData | null {
  const cookie = Cookies.get(COOKIE_NAME);
  
  if (cookie) {
    try {
      return JSON.parse(cookie);
    } catch (error) {
      console.error('Failed to parse tracking cookie:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Save tracking data to cookie
 */
function saveTrackingData(data: LeadTrackingData) {
  Cookies.set(COOKIE_NAME, JSON.stringify(data), {
    expires: COOKIE_EXPIRY,
    sameSite: 'lax',
    secure: window.location.protocol === 'https:',
  });
}

/**
 * Clear tracking data
 */
export function clearTrackingData() {
  Cookies.remove(COOKIE_NAME);
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine lead source from URL parameters
 */
function determineLeadSource(urlParams: URLSearchParams): string {
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  
  // Direct attribution from UTM
  if (utmSource) {
    if (utmMedium === 'cpc' || utmMedium === 'ppc') {
      return 'paid_search';
    }
    if (utmMedium === 'social') {
      return 'social';
    }
    if (utmMedium === 'email') {
      return 'email';
    }
    return utmSource;
  }
  
  // Referrer-based attribution
  const referrer = document.referrer;
  
  if (!referrer || referrer.includes(window.location.hostname)) {
    return 'direct';
  }
  
  if (referrer.includes('google.com') || referrer.includes('bing.com')) {
    return 'organic';
  }
  
  if (referrer.includes('facebook.com') || referrer.includes('instagram.com') || 
      referrer.includes('linkedin.com') || referrer.includes('twitter.com')) {
    return 'social';
  }
  
  return 'referral';
}

/**
 * Get attribution summary for lead creation
 */
export function getAttributionSummary(): Partial<LeadTrackingData> {
  const tracking = getTrackingData();
  
  if (!tracking) {
    return {};
  }
  
  return {
    lead_source: tracking.lead_source,
    utm_source: tracking.utm_source,
    utm_medium: tracking.utm_medium,
    utm_campaign: tracking.utm_campaign,
    utm_content: tracking.utm_content,
    utm_term: tracking.utm_term,
    landing_page: tracking.landing_page,
    page_path: tracking.page_path,
    completed_steps: tracking.completed_steps,
  };
}

/**
 * Track conversion event
 */
export function trackConversion(conversionType: string, value?: number) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      conversion_type: conversionType,
      value: value,
      currency: 'USD',
    });
  }
  
  // Send to Facebook Pixel
  if ((window as any).fbq) {
    (window as any).fbq('track', 'Lead', {
      content_name: conversionType,
      value: value,
      currency: 'USD',
    });
  }
}

// Initialize tracking on load
if (typeof window !== 'undefined') {
  initializeTracking();
}

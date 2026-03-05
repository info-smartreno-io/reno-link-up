/**
 * Google Analytics 4 + Google Tag Manager Integration
 * Framework-agnostic analytics utilities
 */

// GA4 Measurement ID (replace with your actual ID)
export const GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"; // TODO: Replace with actual GA4 ID
export const GTM_ID = "GTM-XXXXXXX"; // TODO: Replace with actual GTM ID

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Initialize Google Tag Manager
 */
export function initGTM() {
  if (typeof window === "undefined") return;

  // Prevent duplicate initialization
  if (window.dataLayer) return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];

  // Load GTM script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);

  // GTM noscript fallback
  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

/**
 * Initialize Google Analytics 4
 */
export function initGA4() {
  if (typeof window === "undefined") return;

  // Load GA4 script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID, {
    send_page_view: true,
  });
}

/**
 * Track page view
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: url,
    page_title: title,
  });

  // Also push to GTM dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "page_view",
    page_path: url,
    page_title: title,
  });
}

/**
 * Track custom events
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window === "undefined") return;

  // GA4
  if (window.gtag) {
    window.gtag("event", eventName, eventParams);
  }

  // GTM dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventParams,
  });
}

/**
 * SmartReno-specific event trackers
 */

// Estimate flow events
export function trackEstimateStart(projectType: string, location?: string) {
  trackEvent("estimate_start", {
    project_type: projectType,
    location: location,
    category: "Estimate",
  });
}

export function trackEstimateStep(step: number, stepName: string) {
  trackEvent("estimate_step", {
    step_number: step,
    step_name: stepName,
    category: "Estimate",
  });
}

export function trackEstimateCompleted(estimateData: {
  projectType: string;
  location: string;
  estimatedValue?: number;
}) {
  trackEvent("estimate_completed", {
    ...estimateData,
    category: "Conversion",
    value: estimateData.estimatedValue || 0,
  });
}

// Calculator events
export function trackCalculatorUsed(calculatorType: string, result?: number) {
  trackEvent("calculator_used", {
    calculator_type: calculatorType,
    result_value: result,
    category: "Engagement",
  });
}

// Form submissions
export function trackFormSubmission(formName: string, formData?: Record<string, any>) {
  trackEvent("form_submit", {
    form_name: formName,
    ...formData,
    category: "Lead",
  });
}

// Professional signup events
export function trackProfessionalSignup(userType: "contractor" | "architect" | "interior_designer") {
  trackEvent("professional_signup", {
    user_type: userType,
    category: "Conversion",
  });
}

// Bid events
export function trackBidViewed(bidId: string, projectType: string) {
  trackEvent("bid_viewed", {
    bid_id: bidId,
    project_type: projectType,
    category: "Engagement",
  });
}

export function trackBidSubmitted(bidId: string, bidAmount: number) {
  trackEvent("bid_submitted", {
    bid_id: bidId,
    bid_amount: bidAmount,
    category: "Conversion",
  });
}

// Content engagement
export function trackBlogPostView(postSlug: string, postCategory: string, tags: string[]) {
  trackEvent("blog_post_view", {
    post_slug: postSlug,
    post_category: postCategory,
    tags: tags.join(","),
    category: "Content",
  });
}

export function trackVideoPlay(videoId: string, videoTitle: string) {
  trackEvent("video_play", {
    video_id: videoId,
    video_title: videoTitle,
    category: "Engagement",
  });
}

// CTA tracking
export function trackCTAClick(ctaName: string, ctaLocation: string, destination?: string) {
  trackEvent("cta_click", {
    cta_name: ctaName,
    cta_location: ctaLocation,
    destination: destination,
    category: "Engagement",
  });
}

// Phone/email clicks
export function trackContactClick(contactType: "phone" | "email", location: string) {
  trackEvent("contact_click", {
    contact_type: contactType,
    click_location: location,
    category: "Lead",
  });
}

// User authentication events
export function trackUserLogin(userType: string) {
  trackEvent("login", {
    method: "email",
    user_type: userType,
  });
}

export function trackUserSignup(userType: string) {
  trackEvent("sign_up", {
    method: "email",
    user_type: userType,
  });
}

// Search events
export function trackSearch(searchTerm: string, resultsCount: number) {
  trackEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

// Error tracking
export function trackError(errorType: string, errorMessage: string, location: string) {
  trackEvent("error", {
    error_type: errorType,
    error_message: errorMessage,
    error_location: location,
    category: "Error",
  });
}

// Scroll depth tracking
export function trackScrollDepth(percentage: number, page: string) {
  trackEvent("scroll_depth", {
    scroll_percentage: percentage,
    page_path: page,
    category: "Engagement",
  });
}

// Homepage-specific events
export function trackHomepageCTA(ctaType: string, ctaLocation: string) {
  trackEvent("homepage_cta_click", {
    cta_type: ctaType,
    cta_location: ctaLocation,
    category: "Conversion",
  });
}

// Town page events
export function trackTownPageView(town: string, county: string) {
  trackEvent("town_page_view", {
    town_name: town,
    county_name: county,
    category: "SEO",
  });
}

export function trackTownPageCTA(town: string, county: string, ctaLocation: string) {
  trackEvent("town_page_cta_click", {
    town_name: town,
    county_name: county,
    cta_location: ctaLocation,
    category: "Conversion",
  });
}


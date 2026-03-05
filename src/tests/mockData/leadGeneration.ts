import type { HomeownerLead } from "@/types/contractor-acquisition";

/**
 * Mock Homeowner Lead Data
 * Test data for homeowner acquisition and attribution tracking
 */

export const mockHomeownerLeads: Partial<HomeownerLead>[] = [
  {
    project_type: "Kitchen Remodeling",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(201) 555-1234",
    zip_code: "07450",
    county: "Bergen County",
    town: "Ridgewood",
    estimated_budget: "$40,000-$60,000",
    timeline: "3-6 months",
    description: "Full kitchen remodel - new cabinets, countertops, appliances, and flooring",
    
    // Attribution
    lead_source: "organic",
    landing_page: "/locations/bergen-county/ridgewood/kitchen-remodeling",
    page_path: [
      "/locations/bergen-county/ridgewood/kitchen-remodeling",
      "/cost-guides/kitchen-remodeling",
      "/get-started",
    ],
    completed_steps: ["project_type", "location", "details", "contact"],
    
    status: "new_lead",
  },
  {
    project_type: "Bathroom Renovation",
    name: "Michael Chen",
    email: "m.chen@example.com",
    phone: "(973) 555-2345",
    zip_code: "07470",
    county: "Passaic County",
    town: "Wayne",
    estimated_budget: "$20,000-$30,000",
    timeline: "1-3 months",
    description: "Master bathroom renovation - new tile, vanity, and fixtures",
    
    // Attribution - Paid Search
    lead_source: "paid_search",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "bathroom-renovation-wayne",
    utm_content: "ad-variant-a",
    utm_term: "bathroom renovation wayne nj",
    landing_page: "/locations/passaic-county/wayne/bathroom-renovation",
    page_path: [
      "/locations/passaic-county/wayne/bathroom-renovation",
      "/get-started",
    ],
    completed_steps: ["project_type", "location", "contact"],
    drop_off_step: "details",
    
    status: "new_lead",
  },
  {
    project_type: "Home Addition",
    name: "Emily Rodriguez",
    email: "emily.r@example.com",
    phone: "(973) 555-3456",
    zip_code: "07960",
    county: "Morris County",
    town: "Morristown",
    estimated_budget: "$100,000-$150,000",
    timeline: "6-12 months",
    
    // Attribution - Social Media
    lead_source: "social",
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "spring-renovation-2024",
    landing_page: "/",
    page_path: [
      "/",
      "/services/home-additions",
      "/locations/morris-county/morristown",
      "/get-started",
    ],
    completed_steps: ["project_type", "location", "details", "contact"],
    
    status: "converted",
    converted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    assigned_estimator_id: "estimator-1-id",
  },
  {
    project_type: "Deck Building",
    name: "Robert Martinez",
    email: "rob.m@example.com",
    zip_code: "07042",
    county: "Essex County",
    town: "Montclair",
    estimated_budget: "$15,000-$25,000",
    
    // Attribution - Email Campaign
    lead_source: "email",
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: "spring-deck-promotion",
    landing_page: "/cost-guides/deck-building",
    page_path: [
      "/cost-guides/deck-building",
      "/get-started",
    ],
    completed_steps: ["project_type", "location"],
    drop_off_step: "details",
    
    status: "new_lead",
  },
  {
    project_type: "Kitchen Remodeling",
    name: "Lisa Thompson",
    email: "lisa.t@example.com",
    phone: "(201) 555-4567",
    zip_code: "07030",
    county: "Hudson County",
    town: "Hoboken",
    estimated_budget: "$50,000-$70,000",
    timeline: "3-6 months",
    
    // Attribution - Direct
    lead_source: "direct",
    landing_page: "/",
    page_path: [
      "/",
      "/services/kitchen-remodeling",
      "/cost-guides/kitchen-remodeling/hudson-county",
      "/get-started",
    ],
    completed_steps: ["project_type", "location", "details", "contact"],
    
    status: "new_lead",
  },
];

/**
 * Sample attribution data for testing tracking utilities
 */
export const mockAttributionData = {
  organic_search: {
    lead_source: "organic",
    landing_page: "/locations/bergen-county/ridgewood/kitchen-remodeling",
    page_path: [
      "/locations/bergen-county/ridgewood/kitchen-remodeling",
      "/cost-guides/kitchen-remodeling",
      "/get-started",
    ],
  },
  paid_search: {
    lead_source: "paid_search",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "bathroom-renovation-nj",
    utm_content: "ad-group-1",
    utm_term: "bathroom contractor near me",
    landing_page: "/locations/passaic-county/wayne",
    page_path: ["/locations/passaic-county/wayne", "/get-started"],
  },
  social_media: {
    lead_source: "social",
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "spring-2024",
    landing_page: "/",
    page_path: ["/", "/services", "/get-started"],
  },
  referral: {
    lead_source: "referral",
    landing_page: "/",
    page_path: ["/", "/services/home-additions", "/get-started"],
  },
};

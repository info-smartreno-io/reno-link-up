import type { ContractorLead, ContractorOnboarding, ContractorReferral } from "@/types/contractor-acquisition";

/**
 * Mock Contractor Acquisition Data
 * Test data for contractor lead generation and onboarding pipeline
 */

export const mockContractorLeads: Partial<ContractorLead>[] = [
  {
    contractor_name: "Bergen Elite Builders",
    contact_name: "Mike Thompson",
    email: "mike@bergenelite.com",
    phone: "(201) 555-0101",
    website: "bergenelitebuilders.com",
    company_size: "6-15",
    years_in_business: 12,
    service_areas: ["07450", "07458", "07430"], // Ridgewood, Saddle River, Mahwah
    specialties: ["Kitchen Remodeling", "Bathroom Renovation", "Home Additions"],
    license_number: "NJ-13VH12345678",
    insurance_verified: true,
    scraped_source: "google",
    quality_score: 85,
    seo_ranking_page: 2,
    review_count: 47,
    average_rating: 4.7,
    website_quality_score: 78,
    outreach_status: "new",
    emails_sent: 0,
    sms_sent: 0,
    calls_made: 0,
  },
  {
    contractor_name: "Passaic Valley Construction",
    contact_name: "Sarah Rodriguez",
    email: "sarah@passaicvalley.com",
    phone: "(973) 555-0202",
    company_size: "2-5",
    years_in_business: 8,
    service_areas: ["07470", "07424", "07501"], // Wayne, Little Falls, Paterson
    specialties: ["Kitchen Remodeling", "Deck Building", "Basement Finishing"],
    license_number: "NJ-13VH87654321",
    insurance_verified: false,
    scraped_source: "yelp",
    quality_score: 72,
    seo_ranking_page: 3,
    review_count: 28,
    average_rating: 4.5,
    outreach_status: "contacted",
    emails_sent: 1,
    sms_sent: 0,
    calls_made: 0,
    first_contact_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    contractor_name: "Morris County Home Pros",
    contact_name: "David Chen",
    email: "david@morriscountyhomes.com",
    phone: "(973) 555-0303",
    website: "morriscountyhomepros.com",
    company_size: "solo",
    years_in_business: 5,
    service_areas: ["07960", "07054", "07869"], // Morristown, Parsippany, Randolph
    specialties: ["Bathroom Renovation", "Kitchen Remodeling"],
    insurance_verified: true,
    scraped_source: "clay",
    quality_score: 68,
    review_count: 15,
    average_rating: 4.8,
    website_quality_score: 65,
    outreach_status: "scheduled",
    emails_sent: 2,
    sms_sent: 1,
    calls_made: 0,
    first_contact_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    scheduled_call_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    contractor_name: "Essex Premier Renovations",
    contact_name: "Jennifer Williams",
    email: "jen@essexpremier.com",
    phone: "(973) 555-0404",
    company_size: "16+",
    years_in_business: 18,
    service_areas: ["07042", "07052", "07040"], // Montclair, West Orange, Maplewood
    specialties: ["Kitchen Remodeling", "Bathroom Renovation", "Home Additions", "Whole House Renovation"],
    license_number: "NJ-13VH11223344",
    insurance_verified: true,
    scraped_source: "google",
    quality_score: 92,
    seo_ranking_page: 1,
    review_count: 89,
    average_rating: 4.9,
    website_quality_score: 88,
    outreach_status: "onboarded",
    emails_sent: 3,
    sms_sent: 1,
    calls_made: 2,
    first_contact_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    scheduled_call_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    onboarded_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    contractor_name: "Budget Basement Builders",
    contact_name: "Tom Jackson",
    email: "tom@budgetbasements.com",
    company_size: "2-5",
    years_in_business: 3,
    service_areas: ["07450"],
    specialties: ["Basement Finishing"],
    scraped_source: "thumbtack",
    quality_score: 45,
    review_count: 8,
    average_rating: 3.9,
    outreach_status: "rejected",
    emails_sent: 2,
    sms_sent: 1,
    calls_made: 0,
    first_contact_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    rejection_reason: "Quality score below threshold",
  },
];

export const mockContractorOnboarding: Partial<ContractorOnboarding>[] = [
  {
    contractor_id: "contractor-1-id",
    license_verified: true,
    insurance_verified: true,
    portfolio_uploaded: true,
    service_areas_mapped: true,
    trade_specialties_selected: true,
    pricing_template_created: true,
    availability_calendar_setup: true,
    license_document_url: "/storage/licenses/contractor-1-license.pdf",
    insurance_document_url: "/storage/insurance/contractor-1-insurance.pdf",
    portfolio_urls: [
      "/storage/portfolio/contractor-1-kitchen-1.jpg",
      "/storage/portfolio/contractor-1-bathroom-1.jpg",
    ],
    onboarding_completion_score: 100,
    profile_quality_score: 92,
    response_rate: 95.5,
    quality_score: 88.0,
    review_score: 4.9,
    completion_rate: 98.0,
    pricing_fairness_index: 1.05,
  },
  {
    contractor_id: "contractor-2-id",
    license_verified: true,
    insurance_verified: false,
    portfolio_uploaded: true,
    service_areas_mapped: true,
    trade_specialties_selected: true,
    pricing_template_created: false,
    availability_calendar_setup: false,
    license_document_url: "/storage/licenses/contractor-2-license.pdf",
    portfolio_urls: [
      "/storage/portfolio/contractor-2-kitchen-1.jpg",
    ],
    onboarding_completion_score: 71,
    profile_quality_score: 68,
    response_rate: 82.0,
    quality_score: 75.0,
    review_score: 4.5,
    completion_rate: 90.0,
    pricing_fairness_index: 1.12,
  },
  {
    contractor_id: "contractor-3-id",
    license_verified: false,
    insurance_verified: true,
    portfolio_uploaded: false,
    service_areas_mapped: true,
    trade_specialties_selected: true,
    pricing_template_created: false,
    availability_calendar_setup: false,
    insurance_document_url: "/storage/insurance/contractor-3-insurance.pdf",
    onboarding_completion_score: 43,
    profile_quality_score: 52,
    response_rate: 78.0,
    quality_score: 68.0,
    review_score: 4.8,
  },
];

export const mockContractorReferrals: Partial<ContractorReferral>[] = [
  {
    referrer_contractor_id: "contractor-1-id",
    referred_contractor_email: "newcontractor1@example.com",
    referred_contractor_name: "NewCo Contractors",
    referred_contractor_phone: "(973) 555-0505",
    status: "invited",
    invited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    referral_credit: 250.00,
    credit_applied: false,
  },
  {
    referrer_contractor_id: "contractor-1-id",
    referred_contractor_id: "contractor-5-id",
    referred_contractor_email: "newcontractor2@example.com",
    referred_contractor_name: "Premium Builds LLC",
    referred_contractor_phone: "(973) 555-0606",
    status: "signed_up",
    invited_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    signed_up_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    referral_credit: 250.00,
    credit_applied: false,
  },
  {
    referrer_contractor_id: "contractor-2-id",
    referred_contractor_id: "contractor-6-id",
    referred_contractor_email: "bestbuilds@example.com",
    referred_contractor_name: "Best Builds Co",
    status: "onboarded",
    invited_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    signed_up_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    onboarded_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    referral_credit: 250.00,
    credit_applied: false,
  },
  {
    referrer_contractor_id: "contractor-1-id",
    referred_contractor_id: "contractor-7-id",
    referred_contractor_email: "topquality@example.com",
    referred_contractor_name: "Top Quality Construction",
    status: "earned_credit",
    invited_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    signed_up_at: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    onboarded_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    referral_credit: 250.00,
    credit_applied: true,
    credit_applied_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Sample outreach sequences for testing
 */
export const mockOutreachSequences = {
  initial_email: {
    subject: "🏗️ Grow Your Business with SmartReno in {location}",
    body: `Hi {contact_name},

I noticed your company {contractor_name} provides excellent {specialties} services in Northern NJ.

SmartReno is building a network of top-rated contractors to connect with pre-qualified homeowners. Unlike other platforms:

✅ No upfront costs or subscriptions
✅ Only pay when you win a project
✅ Compete against just 2-3 other contractors (not 20)
✅ Get detailed project specs before bidding

Want to learn more? Book a 15-min call: [CALENDAR_LINK]

Best,
SmartReno Team`,
    delay_days: 0,
  },
  follow_up_email: {
    subject: "Following up: SmartReno Contractor Network",
    body: `Hi {contact_name},

I reached out last week about joining SmartReno's contractor network.

Just a quick follow-up - we're onboarding {location} contractors this month.

Have 15 minutes this week? [CALENDAR_LINK]

Best,
SmartReno Team`,
    delay_days: 7,
  },
  initial_sms: {
    body: "Hi {contact_name}! SmartReno is connecting top contractors with pre-qualified homeowners in Northern NJ. No subscriptions, only pay when you win. Interested? Reply YES for more info.",
    delay_days: 0,
  },
};

/**
 * Contractor scoring weights for testing
 */
export const mockScoringWeights = {
  review_count: 0.20,
  average_rating: 0.25,
  website_quality: 0.15,
  years_in_business: 0.15,
  license_insurance: 0.15,
  seo_ranking: 0.10,
};

/**
 * Contractor Acquisition Types
 * For the contractor lead generation and onboarding pipeline
 */

export interface ContractorLead {
  id: string;
  contractor_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  
  // Business Details
  company_size?: 'solo' | '2-5' | '6-15' | '16+';
  years_in_business?: number;
  service_areas?: string[];
  specialties?: string[];
  license_number?: string;
  insurance_verified: boolean;
  
  // Acquisition Source
  scraped_source?: string;
  scrape_data?: Record<string, any>;
  referral_source?: string;
  referral_id?: string;
  
  // Scoring & Qualification
  quality_score?: number;
  seo_ranking_page?: number;
  review_count?: number;
  average_rating?: number;
  website_quality_score?: number;
  
  // Outreach Status
  outreach_status: 'new' | 'contacted' | 'scheduled' | 'onboarded' | 'rejected';
  first_contact_date?: string;
  scheduled_call_date?: string;
  onboarded_date?: string;
  rejection_reason?: string;
  
  // Outreach Tracking
  emails_sent: number;
  sms_sent: number;
  calls_made: number;
  last_outreach_date?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ContractorOnboarding {
  id: string;
  contractor_id: string;
  
  // Onboarding Steps
  license_verified: boolean;
  insurance_verified: boolean;
  portfolio_uploaded: boolean;
  service_areas_mapped: boolean;
  trade_specialties_selected: boolean;
  pricing_template_created: boolean;
  availability_calendar_setup: boolean;
  
  // Verification Documents
  license_document_url?: string;
  insurance_document_url?: string;
  portfolio_urls?: string[];
  
  // Scoring
  onboarding_completion_score: number;
  profile_quality_score: number;
  
  // Performance Metrics
  response_rate?: number;
  quality_score?: number;
  review_score?: number;
  completion_rate?: number;
  pricing_fairness_index?: number;
  
  created_at: string;
  updated_at: string;
}

export interface ContractorReferral {
  id: string;
  referrer_contractor_id: string;
  referred_contractor_id?: string;
  referred_contractor_email: string;
  referred_contractor_name?: string;
  referred_contractor_phone?: string;
  
  status: 'invited' | 'signed_up' | 'onboarded' | 'earned_credit';
  invited_at: string;
  signed_up_at?: string;
  onboarded_at?: string;
  
  referral_credit: number;
  credit_applied: boolean;
  credit_applied_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface HomeownerLead {
  id: string;
  user_id?: string;
  project_type: string;
  zip_code?: string;
  county?: string;
  town?: string;
  
  // Attribution
  lead_source?: string;
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Journey
  landing_page?: string;
  page_path?: string[];
  completed_steps?: string[];
  drop_off_step?: string;
  
  // Contact
  name?: string;
  email?: string;
  phone?: string;
  estimated_budget?: string;
  timeline?: string;
  description?: string;
  
  // Status
  status: string;
  converted_at?: string;
  assigned_estimator_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ContractorOutreachSequence {
  email_template: string;
  sms_template: string;
  delay_days: number;
  sequence_step: number;
}

export interface ContractorScoringCriteria {
  review_count_weight: number;
  average_rating_weight: number;
  website_quality_weight: number;
  years_in_business_weight: number;
  response_rate_weight: number;
}

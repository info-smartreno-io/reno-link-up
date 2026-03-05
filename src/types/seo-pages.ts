/**
 * SEO Page Types
 * For programmatic SEO page generation
 */

export interface SEOPage {
  id: string;
  page_type: 'town_page' | 'cost_guide' | 'contractor_directory' | 'blog';
  slug: string;
  title: string;
  meta_description?: string;
  
  // Location Targeting
  state: string;
  county?: string;
  town?: string;
  zip_code?: string;
  
  // Project Targeting
  project_type?: string;
  
  // Content
  content?: SEOPageContent;
  hero_title?: string;
  hero_description?: string;
  
  // SEO Data
  target_keywords?: string[];
  internal_links?: InternalLink[];
  
  // Performance
  published: boolean;
  published_at?: string;
  last_updated: string;
  monthly_views: number;
  monthly_conversions: number;
  
  // AI Maintenance
  ai_generated: boolean;
  last_ai_refresh?: string;
  needs_refresh: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface SEOPageContent {
  sections: ContentSection[];
  faqs?: FAQ[];
  testimonials?: Testimonial[];
  stats?: Stat[];
}

export interface ContentSection {
  id: string;
  type: 'hero' | 'intro' | 'services' | 'cost_breakdown' | 'process' | 'benefits' | 'cta' | 'faq' | 'testimonials';
  heading?: string;
  content: string;
  image_url?: string;
  order: number;
}

export interface InternalLink {
  text: string;
  url: string;
  context: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  project_type?: string;
}

export interface Stat {
  label: string;
  value: string;
  icon?: string;
}

export interface SEOPageGenerationRequest {
  page_type: 'town_page' | 'cost_guide' | 'contractor_directory';
  county?: string;
  town?: string;
  project_type?: string;
  auto_publish?: boolean;
}

export interface SEOPageTemplate {
  title_template: string;
  meta_description_template: string;
  hero_title_template: string;
  hero_description_template: string;
  sections: ContentSection[];
  keywords: string[];
}

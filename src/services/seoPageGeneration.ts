import { supabase } from "@/integrations/supabase/client";
import type { SEOPage, SEOPageGenerationRequest, SEOPageContent } from "@/types/seo-pages";
import { ALL_COUNTIES, ALL_TOWNS, PROJECT_TYPES } from "@/data/locations";

export const seoPageGenerationService = {
  /**
   * Generate a town page for a specific town and project type
   */
  async generateTownPage(town: string, county: string, projectType?: string) {
    const townData = ALL_TOWNS.find(t => t.slug === town && t.countySlug === county);
    if (!townData) {
      throw new Error(`Town ${town} not found in ${county}`);
    }

    const projectData = projectType 
      ? PROJECT_TYPES.find(p => p.slug === projectType)
      : null;

    const slug = projectType 
      ? `/locations/${county}/${town}/${projectType}`
      : `/locations/${county}/${town}`;

    const title = projectType
      ? `${projectData?.name} in ${townData.name}, ${county.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} | SmartReno`
      : `Home Renovation Contractors in ${townData.name}, NJ | SmartReno`;

    const metaDescription = projectType
      ? `Looking for ${projectData?.name.toLowerCase()} in ${townData.name}? Get 3 pre-screened contractor bids. Average cost: $${projectData?.avgCost.toLocaleString()}. Free estimates.`
      : `Find pre-screened home renovation contractors in ${townData.name}, ${county.replace('-', ' ')}. Compare 3 verified bids for kitchens, bathrooms, additions & more.`;

    const content: SEOPageContent = {
      sections: [
        {
          id: '1',
          type: 'hero',
          heading: projectType
            ? `${projectData?.name} in ${townData.name}, NJ`
            : `Home Renovation Contractors in ${townData.name}`,
          content: projectType
            ? `Transform your ${townData.name} home with professional ${projectData?.name.toLowerCase()}. Get 3 pre-screened contractor bids in minutes. SmartReno connects you with licensed, insured contractors who specialize in ${projectData?.name.toLowerCase()} for ${townData.name} homes.`
            : `SmartReno connects ${townData.name} homeowners with Northern NJ's top-rated renovation contractors. Get 3 pre-screened bids for your project - whether it's a kitchen remodel, bathroom renovation, or full home addition.`,
          order: 1,
        },
        {
          id: '2',
          type: 'intro',
          heading: projectType ? `Why Choose SmartReno for ${projectData?.name} in ${townData.name}?` : 'Why Choose SmartReno?',
          content: projectType
            ? `SmartReno simplifies ${projectData?.name.toLowerCase()} in ${townData.name}. We pre-screen contractors, verify licenses and insurance, and coordinate bids so you can focus on your dream ${projectData?.name.toLowerCase()} project. Our contractors understand ${townData.name} building codes, permitting requirements, and local architectural styles.`
            : `We pre-screen every contractor for licenses, insurance, and quality work. Get detailed proposals from 3 contractors who understand ${townData.name} building codes and permitting. No more endless phone calls or unreturned emails - SmartReno coordinates everything.`,
          order: 2,
        },
        {
          id: '3',
          type: 'cost_breakdown',
          heading: projectType ? `${projectData?.name} Cost in ${townData.name}` : 'Average Renovation Costs in ${townData.name}',
          content: projectType
            ? `Average ${projectData?.name.toLowerCase()} cost in ${townData.name}: $${projectData?.avgCost.toLocaleString()}. Timeline: ${projectData?.timeline}. Costs vary based on materials, scope, and home size. Get accurate estimates from SmartReno contractors who know ${townData.name} pricing.`
            : `Kitchen remodeling: $35,000-$65,000 | Bathroom renovation: $18,000-$38,000 | Home additions: $100,000-$200,000 | Basement finishing: $25,000-$50,000. Prices reflect ${townData.name} market rates, permit costs, and typical project scopes.`,
          order: 3,
        },
        {
          id: '4',
          type: 'process',
          heading: 'How SmartReno Works',
          content: `1. Tell us about your ${projectType ? projectData?.name.toLowerCase() : 'renovation'} project in ${townData.name}\n2. Get 3 pre-screened contractor bids within 48 hours\n3. Review detailed proposals with photos, timelines, and references\n4. Choose your contractor and start your project\n5. SmartReno coordinates permits, inspections, and quality checks`,
          order: 4,
        },
        {
          id: '5',
          type: 'benefits',
          heading: `Local Expertise in ${townData.name}`,
          content: `Our contractors know ${townData.name}'s unique characteristics - from zoning regulations to common home styles. They understand ${county.replace('-', ' ')} County permitting and work with local inspectors regularly. Average home value in ${townData.name}: $${townData.avgHomeValue.toLocaleString()}.`,
          order: 5,
        },
        {
          id: '6',
          type: 'cta',
          content: `Ready to start your ${projectType ? projectData?.name.toLowerCase() : 'renovation'} in ${townData.name}? Get 3 free contractor bids in minutes. No obligation. Pre-screened professionals only.`,
          order: 6,
        },
      ],
      faqs: [
        {
          question: projectType 
            ? `How much does ${projectData?.name.toLowerCase()} cost in ${townData.name}?`
            : `What's the average cost of a renovation in ${townData.name}?`,
          answer: projectType
            ? `${projectData?.name} in ${townData.name} typically costs $${projectData?.avgCost.toLocaleString()}, but varies based on materials, scope, and your specific home. SmartReno contractors provide detailed estimates based on your exact needs.`
            : `Renovation costs in ${townData.name} vary widely. Kitchen remodels average $45,000, bathroom renovations $28,000, and home additions $125,000. SmartReno provides 3 detailed bids so you can compare pricing and scope.`,
        },
        {
          question: `Do I need a permit for ${projectType ? projectData?.name.toLowerCase() : 'my renovation'} in ${townData.name}?`,
          answer: `Most ${projectType ? projectData?.name.toLowerCase() + ' projects' : 'major renovations'} in ${townData.name} require permits from ${county.replace('-', ' ')} County. SmartReno contractors handle all permitting and know local requirements. We coordinate inspections and ensure code compliance.`,
        },
        {
          question: 'How long does the bidding process take?',
          answer: 'Most ${townData.name} homeowners receive 3 contractor bids within 48 hours. SmartReno pre-screens contractors so you only see qualified, available professionals who can start your project on your timeline.',
        },
      ],
      stats: [
        { label: 'Average Project Cost', value: projectType ? `$${projectData?.avgCost.toLocaleString()}` : '$45,000', icon: 'dollar-sign' },
        { label: 'Typical Timeline', value: projectType ? projectData?.timeline || '6-12 weeks' : '8-16 weeks', icon: 'calendar' },
        { label: 'Pre-screened Contractors', value: '3', icon: 'users' },
        { label: 'Response Time', value: '48 hours', icon: 'clock' },
      ],
    };

    const keywords = projectType
      ? [
          `${projectData?.name} ${townData.name}`,
          `${projectData?.name} ${county}`,
          `${townData.name} ${projectData?.slug}`,
          `contractor ${townData.name}`,
          `${projectData?.name} cost ${townData.name}`,
        ]
      : [
          `home renovation ${townData.name}`,
          `contractors ${townData.name}`,
          `remodeling ${townData.name}`,
          `${townData.name} contractors`,
          `renovation ${county}`,
        ];

    const { data, error } = await supabase
      .from('seo_pages')
      .insert([{
        page_type: 'town_page',
        slug,
        title,
        meta_description: metaDescription,
        state: 'New Jersey',
        county: county,
        town: townData.name,
        zip_code: townData.zipCodes[0],
        project_type: projectType || undefined,
        content: content as any,
        hero_title: content.sections[0].heading,
        hero_description: content.sections[0].content,
        target_keywords: keywords,
        published: false,
        monthly_views: 0,
        monthly_conversions: 0,
        ai_generated: true,
        needs_refresh: false,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as any as SEOPage;
  },

  /**
   * Generate cost guide page for a project type
   */
  async generateCostGuide(projectType: string, county?: string) {
    const projectData = PROJECT_TYPES.find(p => p.slug === projectType);
    if (!projectData) {
      throw new Error(`Project type ${projectType} not found`);
    }

    const locationSuffix = county 
      ? ` in ${county.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
      : ' in Northern NJ';

    const slug = county
      ? `/cost-guides/${projectType}/${county}`
      : `/cost-guides/${projectType}`;

    const title = `${projectData.name} Cost Guide${locationSuffix} | SmartReno`;
    const metaDescription = `Complete ${projectData.name.toLowerCase()} cost guide${locationSuffix}. Average cost: $${projectData.avgCost.toLocaleString()}. Get 3 contractor bids & detailed pricing breakdown.`;

    const content: SEOPageContent = {
      sections: [
        {
          id: '1',
          type: 'hero',
          heading: `${projectData.name} Cost Guide${locationSuffix}`,
          content: `Planning a ${projectData.name.toLowerCase()}${locationSuffix}? Understand costs, timelines, and what affects pricing. Get 3 detailed contractor bids to compare accurate estimates for your specific project.`,
          order: 1,
        },
        {
          id: '2',
          type: 'cost_breakdown',
          heading: 'Average Cost Breakdown',
          content: `Total Average Cost: $${projectData.avgCost.toLocaleString()}\n\nLabor: 40-50% of total\nMaterials: 30-40% of total\nPermits & Fees: 5-10% of total\nDesign & Planning: 5-10% of total\nContingency: 10-15% of total\n\nTimeline: ${projectData.timeline}`,
          order: 2,
        },
        {
          id: '3',
          type: 'intro',
          heading: 'What Affects Cost?',
          content: `${projectData.name} costs vary based on:\n\n• Project scope and size\n• Material quality and finishes\n• Structural changes required\n• Permit and inspection fees${county ? `\n• ${county.replace('-', ' ')} County building codes` : ''}\n• Labor rates${locationSuffix}\n• Timeline and scheduling\n• Access and site conditions`,
          order: 3,
        },
      ],
      faqs: [
        {
          question: `How much does ${projectData.name.toLowerCase()} cost${locationSuffix}?`,
          answer: `${projectData.name}${locationSuffix} typically costs $${projectData.avgCost.toLocaleString()}, but can range from ${Math.floor(projectData.avgCost * 0.7).toLocaleString()} to ${Math.floor(projectData.avgCost * 1.5).toLocaleString()} depending on scope, materials, and complexity.`,
        },
        {
          question: 'What payment schedule should I expect?',
          answer: 'Most contractors require 10-30% deposit, with payments at project milestones (demolition, framing, rough-in, finish). Never pay more than 50% upfront. SmartReno contractors follow industry-standard payment practices.',
        },
      ],
    };

    const keywords = [
      `${projectData.name} cost${county ? ` ${county}` : ''}`,
      `how much ${projectData.slug}${county ? ` ${county}` : ''}`,
      `${projectData.slug} price${county ? ` ${county}` : ''}`,
      `${projectData.slug} estimate`,
    ];

    const { data, error } = await supabase
      .from('seo_pages')
      .insert([{
        page_type: 'cost_guide',
        slug,
        title,
        meta_description: metaDescription,
        state: 'New Jersey',
        county: county || undefined,
        project_type: projectType,
        content: content as any,
        hero_title: content.sections[0].heading,
        hero_description: content.sections[0].content,
        target_keywords: keywords,
        published: false,
        monthly_views: 0,
        monthly_conversions: 0,
        ai_generated: true,
        needs_refresh: false,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as any as SEOPage;
  },

  /**
   * Get all SEO pages with filters
   */
  async getSEOPages(filters?: {
    page_type?: string;
    county?: string;
    published?: boolean;
    needs_refresh?: boolean;
  }) {
    let query = supabase
      .from('seo_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.page_type) {
      query = query.eq('page_type', filters.page_type);
    }

    if (filters?.county) {
      query = query.eq('county', filters.county);
    }

    if (filters?.published !== undefined) {
      query = query.eq('published', filters.published);
    }

    if (filters?.needs_refresh !== undefined) {
      query = query.eq('needs_refresh', filters.needs_refresh);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as any as SEOPage[];
  },

  /**
   * Publish an SEO page
   */
  async publishPage(pageId: string) {
    const { data, error } = await supabase
      .from('seo_pages')
      .update({
        published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;
    return data as any as SEOPage;
  },

  /**
   * Bulk generate pages for a county
   */
  async bulkGenerateCountyPages(countySlug: string) {
    const county = ALL_COUNTIES.find(c => c.slug === countySlug);
    if (!county) {
      throw new Error(`County ${countySlug} not found`);
    }

    const results = [];

    // Generate a town page for each town (no project type - general page)
    for (const town of county.towns) {
      try {
        const page = await this.generateTownPage(town.slug, countySlug);
        results.push(page);
      } catch (error) {
        console.error(`Failed to generate page for ${town.name}:`, error);
      }
    }

    return results;
  },
};

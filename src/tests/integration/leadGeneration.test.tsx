import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { homeownerLeadService } from '@/services/homeownerLeadService';
import { seoPageGenerationService } from '@/services/seoPageGeneration';
import { mockHomeownerLeads } from '../mockData/leadGeneration';

/**
 * Lead Generation Integration Tests
 * 
 * Tests the complete homeowner lead generation system:
 * - Homeowner lead creation with attribution
 * - SEO page generation
 * - Lead tracking and journey
 * - Attribution analytics
 */

describe('Homeowner Lead Generation', () => {
  
  describe('Lead Creation with Attribution', () => {
    it('should create homeowner lead with full attribution data', async () => {
      const leadData = mockHomeownerLeads[0];
      
      const created = await homeownerLeadService.createLead({
        project_type: leadData.project_type!,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        zip_code: leadData.zip_code,
        estimated_budget: leadData.estimated_budget,
        timeline: leadData.timeline,
        description: leadData.description,
      });
      
      expect(created).toBeDefined();
      expect(created.project_type).toBe(leadData.project_type);
      expect(created.status).toBe('new_lead');
    });

    it('should track organic search attribution', async () => {
      const leadData = mockHomeownerLeads[0]; // organic search lead
      
      const created = await homeownerLeadService.createLead({
        project_type: leadData.project_type!,
        email: leadData.email!,
      });
      
      expect(created.lead_source).toBe('organic');
      expect(created.landing_page).toContain('/locations/');
    });

    it('should track paid search attribution with UTM parameters', async () => {
      const leadData = mockHomeownerLeads[1]; // paid search lead
      
      const created = await homeownerLeadService.createLead({
        project_type: leadData.project_type!,
        email: leadData.email!,
      });
      
      expect(created.lead_source).toBe('paid_search');
      expect(created.utm_source).toBe('google');
      expect(created.utm_medium).toBe('cpc');
      expect(created.utm_campaign).toBeDefined();
    });

    it('should track page journey path', async () => {
      const leadData = mockHomeownerLeads[2]; // with full journey
      
      const created = await homeownerLeadService.createLead({
        project_type: leadData.project_type!,
        email: leadData.email!,
      });
      
      expect(created.page_path).toBeDefined();
      expect(Array.isArray(created.page_path)).toBe(true);
    });

    it('should track completed intake steps', async () => {
      const leadData = mockHomeownerLeads[0];
      
      const created = await homeownerLeadService.createLead({
        project_type: leadData.project_type!,
        email: leadData.email!,
      });
      
      // Track steps
      await homeownerLeadService.trackStep(created.id, 'project_type');
      await homeownerLeadService.trackStep(created.id, 'location');
      await homeownerLeadService.trackStep(created.id, 'contact');
      
      const updated = await homeownerLeadService.getLead(created.id);
      
      expect(updated.completed_steps).toBeDefined();
      expect(updated.completed_steps?.length).toBeGreaterThanOrEqual(3);
    });

    it('should identify drop-off points', async () => {
      const leadData = mockHomeownerLeads[3]; // with drop-off
      
      const created = await homeownerLeadService.createLead({
        project_type: leadData.project_type!,
        email: leadData.email!,
      });
      
      await homeownerLeadService.updateLead(created.id, {
        drop_off_step: 'details',
      });
      
      const updated = await homeownerLeadService.getLead(created.id);
      expect(updated.drop_off_step).toBe('details');
    });
  });

  describe('Programmatic SEO Pages', () => {
    it('should generate town page with project type', async () => {
      const page = await seoPageGenerationService.generateTownPage(
        'ridgewood',
        'bergen-county',
        'kitchen-remodeling'
      );
      
      expect(page).toBeDefined();
      expect(page.page_type).toBe('town_page');
      expect(page.town).toBe('Ridgewood');
      expect(page.county).toBe('bergen-county');
      expect(page.project_type).toBe('kitchen-remodeling');
      expect(page.slug).toContain('/locations/bergen-county/ridgewood/kitchen-remodeling');
    });

    it('should generate general town page without project type', async () => {
      const page = await seoPageGenerationService.generateTownPage(
        'wayne',
        'passaic-county'
      );
      
      expect(page).toBeDefined();
      expect(page.town).toBe('Wayne');
      expect(page.project_type).toBeUndefined();
      expect(page.slug).toBe('/locations/passaic-county/wayne');
    });

    it('should generate cost guide page', async () => {
      const page = await seoPageGenerationService.generateCostGuide(
        'kitchen-remodeling',
        'bergen-county'
      );
      
      expect(page).toBeDefined();
      expect(page.page_type).toBe('cost_guide');
      expect(page.project_type).toBe('kitchen-remodeling');
      expect(page.county).toBe('bergen-county');
      expect(page.title).toContain('Cost Guide');
    });

    it('should generate page content with structured sections', async () => {
      const page = await seoPageGenerationService.generateTownPage(
        'morristown',
        'morris-county',
        'bathroom-renovation'
      );
      
      expect(page.content).toBeDefined();
      expect(page.hero_title).toBeDefined();
      expect(page.hero_description).toBeDefined();
      expect(page.target_keywords).toBeDefined();
      expect(page.target_keywords?.length).toBeGreaterThan(0);
    });

    it('should include location-specific pricing in content', async () => {
      const page = await seoPageGenerationService.generateTownPage(
        'millburn',
        'essex-county',
        'kitchen-remodeling'
      );
      
      const contentStr = JSON.stringify(page.content);
      expect(contentStr).toContain('Millburn');
      expect(contentStr.toLowerCase()).toContain('cost');
    });
  });

  describe('Attribution Analytics', () => {
    it('should track leads by source', async () => {
      // Create leads with different sources
      for (const leadData of mockHomeownerLeads.slice(0, 3)) {
        await homeownerLeadService.createLead({
          project_type: leadData.project_type!,
          email: leadData.email!,
        });
      }
      
      const stats = await homeownerLeadService.getAttributionStats();
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.by_source).toBeDefined();
      expect(Object.keys(stats.by_source).length).toBeGreaterThan(0);
    });

    it('should calculate conversion rates by source', async () => {
      // Create converted lead
      await homeownerLeadService.createLead({
        project_type: "Kitchen Remodeling",
        email: "converted@example.com",
      });
      
      const stats = await homeownerLeadService.getAttributionStats();
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.converted).toBeGreaterThanOrEqual(0);
    });

    it('should filter attribution stats by date range', async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const stats = await homeownerLeadService.getAttributionStats({
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString(),
      });
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Lead Journey Tracking', () => {
    it('should track multi-page journey before conversion', async () => {
      const leadData = mockHomeownerLeads[2]; // has full journey
      
      const created = await homeownerLeadService.createLead({
        project_type: leadData.project_type!,
        email: leadData.email!,
      });
      
      expect(created.page_path).toBeDefined();
      expect(created.page_path?.length).toBeGreaterThan(1);
    });

    it('should update lead status through pipeline', async () => {
      const created = await homeownerLeadService.createLead({
        project_type: "Kitchen Remodeling",
        email: "pipeline@example.com",
      });
      
      // Move through pipeline
      await homeownerLeadService.updateLead(created.id, {
        status: 'contacted',
        assigned_estimator_id: 'estimator-1-id',
      });
      
      let updated = await homeownerLeadService.getLead(created.id);
      expect(updated.status).toBe('contacted');
      
      // Convert lead
      await homeownerLeadService.updateLead(created.id, {
        status: 'converted',
        converted_at: new Date().toISOString(),
      });
      
      updated = await homeownerLeadService.getLead(created.id);
      expect(updated.status).toBe('converted');
      expect(updated.converted_at).toBeDefined();
    });
  });

  describe('SEO Page Performance', () => {
    it('should track page views and conversions', async () => {
      const page = await seoPageGenerationService.generateTownPage(
        'paramus',
        'bergen-county'
      );
      
      // Simulate traffic
      await supabase
        .from('seo_pages')
        .update({ 
          monthly_views: 150,
          monthly_conversions: 5,
        } as any)
        .eq('id', page.id);
      
      const updated = await seoPageGenerationService.getSEOPages({
        page_type: 'town_page',
      });
      
      const updatedPage = updated.find(p => p.id === page.id);
      expect(updatedPage?.monthly_views).toBe(150);
      expect(updatedPage?.monthly_conversions).toBe(5);
    });

    it('should identify pages needing refresh', async () => {
      const page = await seoPageGenerationService.generateTownPage(
        'hackensack',
        'bergen-county'
      );
      
      // Mark as needing refresh
      await supabase
        .from('seo_pages')
        .update({ needs_refresh: true } as any)
        .eq('id', page.id);
      
      const pagesNeedingRefresh = await seoPageGenerationService.getSEOPages({
        needs_refresh: true,
      });
      
      expect(pagesNeedingRefresh.some(p => p.id === page.id)).toBe(true);
    });
  });

  describe('Bulk Generation', () => {
    it('should bulk generate pages for an entire county', async () => {
      const pages = await seoPageGenerationService.bulkGenerateCountyPages('bergen-county');
      
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.every(p => p.county === 'bergen-county')).toBe(true);
      expect(pages.every(p => p.page_type === 'town_page')).toBe(true);
    });
  });
});

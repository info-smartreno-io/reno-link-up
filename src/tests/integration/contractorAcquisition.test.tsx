import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { contractorAcquisitionService } from '@/services/contractorAcquisition';
import { mockContractorLeads, mockContractorOnboarding, mockContractorReferrals } from '../mockData/contractorAcquisition';

/**
 * Contractor Acquisition Integration Tests
 * 
 * Tests the complete contractor lead generation and onboarding pipeline:
 * - Lead creation and management
 * - Quality scoring
 * - Outreach automation
 * - Onboarding tracking
 * - Referral system
 */

describe('Contractor Acquisition Pipeline', () => {
  
  describe('Contractor Lead Management', () => {
    it('should create a new contractor lead with all fields', async () => {
      const newLead = mockContractorLeads[0];
      
      const created = await contractorAcquisitionService.createContractorLead(newLead);
      
      expect(created).toBeDefined();
      expect(created.contractor_name).toBe(newLead.contractor_name);
      expect(created.email).toBe(newLead.email);
      expect(created.outreach_status).toBe('new');
      expect(created.emails_sent).toBe(0);
    });

    it('should retrieve contractor leads with filters', async () => {
      // Create multiple leads
      for (const lead of mockContractorLeads.slice(0, 3)) {
        await contractorAcquisitionService.createContractorLead(lead);
      }

      // Filter by status
      const newLeads = await contractorAcquisitionService.getContractorLeads({ 
        status: 'new' 
      });
      
      expect(newLeads.length).toBeGreaterThan(0);
      expect(newLeads.every(l => l.outreach_status === 'new')).toBe(true);

      // Filter by quality score
      const highQualityLeads = await contractorAcquisitionService.getContractorLeads({ 
        minQualityScore: 80 
      });
      
      expect(highQualityLeads.every(l => (l.quality_score || 0) >= 80)).toBe(true);
    });

    it('should update contractor lead status', async () => {
      const lead = await contractorAcquisitionService.createContractorLead(mockContractorLeads[0]);
      
      const updated = await contractorAcquisitionService.updateContractorLead(lead.id, {
        outreach_status: 'contacted',
        first_contact_date: new Date().toISOString(),
        emails_sent: 1,
      });
      
      expect(updated.outreach_status).toBe('contacted');
      expect(updated.emails_sent).toBe(1);
      expect(updated.first_contact_date).toBeDefined();
    });
  });

  describe('Quality Scoring System', () => {
    it('should calculate quality score based on multiple factors', async () => {
      const lead = await contractorAcquisitionService.createContractorLead({
        contractor_name: "Test Contractor",
        email: "test@example.com",
        review_count: 50,
        average_rating: 4.8,
        years_in_business: 15,
        license_number: "NJ-12345678",
        insurance_verified: true,
        website_quality_score: 85,
        seo_ranking_page: 2,
        outreach_status: 'new',
        emails_sent: 0,
        sms_sent: 0,
        calls_made: 0,
      });

      const result = await contractorAcquisitionService.calculateQualityScore(lead.id);
      
      expect(result.quality_score).toBeGreaterThan(80);
      expect(result.recommended).toBe(true);
      expect(result.priority).toBe('high');
    });

    it('should identify low quality leads', async () => {
      const lead = await contractorAcquisitionService.createContractorLead({
        contractor_name: "Low Quality Contractor",
        email: "low@example.com",
        review_count: 5,
        average_rating: 3.5,
        years_in_business: 2,
        outreach_status: 'new',
        emails_sent: 0,
        sms_sent: 0,
        calls_made: 0,
      });

      const result = await contractorAcquisitionService.calculateQualityScore(lead.id);
      
      expect(result.quality_score).toBeLessThan(60);
      expect(result.recommended).toBe(false);
      expect(result.priority).toBe('low');
    });
  });

  describe('Contractor Onboarding', () => {
    it('should create contractor onboarding record', async () => {
      const contractorId = 'test-contractor-id';
      const onboarding = mockContractorOnboarding[0];
      
      const created = await contractorAcquisitionService.updateContractorOnboarding(
        contractorId,
        onboarding
      );
      
      expect(created.contractor_id).toBe(contractorId);
      expect(created.license_verified).toBe(true);
      expect(created.insurance_verified).toBe(true);
    });

    it('should calculate onboarding completion score', async () => {
      const contractorId = 'test-contractor-id-2';
      
      // Partially complete onboarding
      const onboarding = await contractorAcquisitionService.updateContractorOnboarding(
        contractorId,
        {
          license_verified: true,
          insurance_verified: true,
          portfolio_uploaded: false,
          service_areas_mapped: true,
          trade_specialties_selected: true,
          pricing_template_created: false,
          availability_calendar_setup: false,
        }
      );
      
      // Should be approximately 57% complete (4 out of 7 steps)
      expect(onboarding.onboarding_completion_score).toBeGreaterThanOrEqual(50);
      expect(onboarding.onboarding_completion_score).toBeLessThanOrEqual(65);
    });

    it('should track 100% completion when all steps done', async () => {
      const contractorId = 'test-contractor-id-3';
      const fullOnboarding = mockContractorOnboarding[0];
      
      const completed = await contractorAcquisitionService.updateContractorOnboarding(
        contractorId,
        fullOnboarding
      );
      
      expect(completed.onboarding_completion_score).toBe(100);
    });
  });

  describe('Contractor Referral System', () => {
    it('should create a contractor referral', async () => {
      const referral = await contractorAcquisitionService.createReferral({
        referrer_contractor_id: 'contractor-1-id',
        referred_contractor_email: 'newcontractor@example.com',
        referred_contractor_name: 'New Contractor LLC',
        status: 'invited',
        invited_at: new Date().toISOString(),
        referral_credit: 250.00,
        credit_applied: false,
      });
      
      expect(referral).toBeDefined();
      expect(referral.referral_credit).toBe(250.00);
      expect(referral.status).toBe('invited');
      expect(referral.credit_applied).toBe(false);
    });

    it('should update referral status through pipeline stages', async () => {
      const referral = await contractorAcquisitionService.createReferral({
        referrer_contractor_id: 'contractor-1-id',
        referred_contractor_email: 'pipeline@example.com',
        status: 'invited',
        invited_at: new Date().toISOString(),
        referral_credit: 250.00,
        credit_applied: false,
      });
      
      // Move to signed_up
      let updated = await contractorAcquisitionService.updateReferralStatus(
        referral.id,
        'signed_up'
      );
      expect(updated.status).toBe('signed_up');
      expect(updated.signed_up_at).toBeDefined();
      
      // Move to onboarded
      updated = await contractorAcquisitionService.updateReferralStatus(
        referral.id,
        'onboarded'
      );
      expect(updated.status).toBe('onboarded');
      expect(updated.onboarded_at).toBeDefined();
      
      // Move to earned_credit
      updated = await contractorAcquisitionService.updateReferralStatus(
        referral.id,
        'earned_credit'
      );
      expect(updated.status).toBe('earned_credit');
      expect(updated.credit_applied).toBe(true);
      expect(updated.credit_applied_at).toBeDefined();
    });

    it('should track multiple referrals per contractor', async () => {
      const contractorId = 'contractor-1-id';
      
      // Create multiple referrals
      await contractorAcquisitionService.createReferral({
        referrer_contractor_id: contractorId,
        referred_contractor_email: 'ref1@example.com',
        status: 'invited',
        invited_at: new Date().toISOString(),
        referral_credit: 250.00,
        credit_applied: false,
      });
      
      await contractorAcquisitionService.createReferral({
        referrer_contractor_id: contractorId,
        referred_contractor_email: 'ref2@example.com',
        status: 'signed_up',
        invited_at: new Date().toISOString(),
        referral_credit: 250.00,
        credit_applied: false,
      });
      
      const referrals = await contractorAcquisitionService.getContractorReferrals(contractorId);
      
      expect(referrals.length).toBeGreaterThanOrEqual(2);
      expect(referrals.every(r => r.referrer_contractor_id === contractorId)).toBe(true);
    });
  });

  describe('Bulk Import', () => {
    it('should bulk import contractor leads', async () => {
      const leads = mockContractorLeads.slice(0, 3);
      
      const imported = await contractorAcquisitionService.bulkImportLeads(leads);
      
      expect(imported.length).toBe(3);
      expect(imported.every(l => l.id)).toBe(true);
    });
  });

  describe('Acquisition Stats', () => {
    it('should calculate acquisition statistics', async () => {
      // Create leads with different statuses
      await contractorAcquisitionService.createContractorLead({
        ...mockContractorLeads[0],
        outreach_status: 'new',
      });
      
      await contractorAcquisitionService.createContractorLead({
        ...mockContractorLeads[1],
        outreach_status: 'contacted',
      });
      
      await contractorAcquisitionService.createContractorLead({
        ...mockContractorLeads[3],
        outreach_status: 'onboarded',
      });
      
      const stats = await contractorAcquisitionService.getAcquisitionStats();
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.new).toBeGreaterThan(0);
      expect(stats.contacted).toBeGreaterThan(0);
      expect(stats.onboarded).toBeGreaterThan(0);
    });
  });

  describe('Cross-System Integration', () => {
    it('should link contractor lead to onboarded contractor user', async () => {
      // Create contractor lead
      const lead = await contractorAcquisitionService.createContractorLead({
        ...mockContractorLeads[0],
        outreach_status: 'scheduled',
      });
      
      // Update to onboarded
      await contractorAcquisitionService.updateContractorLead(lead.id, {
        outreach_status: 'onboarded',
        onboarded_date: new Date().toISOString(),
      });
      
      // Create onboarding record (simulating user signup)
      const contractorUserId = 'new-contractor-user-id';
      const onboarding = await contractorAcquisitionService.updateContractorOnboarding(
        contractorUserId,
        {
          license_verified: false,
          insurance_verified: false,
          portfolio_uploaded: false,
          service_areas_mapped: false,
          trade_specialties_selected: false,
          pricing_template_created: false,
          availability_calendar_setup: false,
        }
      );
      
      expect(onboarding.contractor_id).toBe(contractorUserId);
      expect(onboarding.onboarding_completion_score).toBeGreaterThanOrEqual(0);
    });
  });
});

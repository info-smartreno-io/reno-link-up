import { supabase } from "@/integrations/supabase/client";
import type { ContractorLead, ContractorOnboarding, ContractorReferral } from "@/types/contractor-acquisition";

export const contractorAcquisitionService = {
  /**
   * Get all contractor leads with filtering and sorting
   */
  async getContractorLeads(filters?: {
    status?: string;
    minQualityScore?: number;
    specialties?: string[];
  }) {
    let query = supabase
      .from('contractor_leads')
      .select('*')
      .order('quality_score', { ascending: false, nullsFirst: false });

    if (filters?.status) {
      query = query.eq('outreach_status', filters.status);
    }

    if (filters?.minQualityScore) {
      query = query.gte('quality_score', filters.minQualityScore);
    }

    if (filters?.specialties && filters.specialties.length > 0) {
      query = query.overlaps('specialties', filters.specialties);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as ContractorLead[];
  },

  /**
   * Create a new contractor lead
   */
  async createContractorLead(lead: Partial<ContractorLead>) {
    const { data, error } = await supabase
      .from('contractor_leads')
      .insert([lead as any])
      .select()
      .single();

    if (error) throw error;
    return data as ContractorLead;
  },

  /**
   * Update contractor lead status and outreach tracking
   */
  async updateContractorLead(id: string, updates: Partial<ContractorLead>) {
    const { data, error } = await supabase
      .from('contractor_leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ContractorLead;
  },

  /**
   * Trigger outreach sequence for a contractor lead
   */
  async triggerOutreach(contractorLeadId: string, outreachType: 'email' | 'sms' | 'both') {
    const { data, error } = await supabase.functions.invoke('contractor-outreach', {
      body: {
        contractor_lead_id: contractorLeadId,
        outreach_type: outreachType,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Calculate quality score for a contractor lead
   */
  async calculateQualityScore(contractorLeadId: string) {
    const { data, error } = await supabase.functions.invoke('contractor-scoring', {
      body: {
        contractor_lead_id: contractorLeadId,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Get contractor onboarding status
   */
  async getContractorOnboarding(contractorId: string) {
    const { data, error } = await supabase
      .from('contractor_onboarding')
      .select('*')
      .eq('contractor_id', contractorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ContractorOnboarding | null;
  },

  /**
   * Update contractor onboarding progress
   */
  async updateContractorOnboarding(contractorId: string, updates: Partial<ContractorOnboarding>) {
    // Calculate completion score
    const completionFields = [
      'license_verified',
      'insurance_verified',
      'portfolio_uploaded',
      'service_areas_mapped',
      'trade_specialties_selected',
      'pricing_template_created',
      'availability_calendar_setup',
    ];

    let completionScore = 0;
    for (const field of completionFields) {
      if (updates[field as keyof ContractorOnboarding]) {
        completionScore += (100 / completionFields.length);
      }
    }

    const { data, error } = await supabase
      .from('contractor_onboarding')
      .upsert({
        contractor_id: contractorId,
        ...updates,
        onboarding_completion_score: Math.round(completionScore),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ContractorOnboarding;
  },

  /**
   * Create a contractor referral
   */
  async createReferral(referral: Omit<ContractorReferral, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('contractor_referrals')
      .insert(referral)
      .select()
      .single();

    if (error) throw error;
    return data as ContractorReferral;
  },

  /**
   * Get contractor referrals
   */
  async getContractorReferrals(contractorId: string) {
    const { data, error } = await supabase
      .from('contractor_referrals')
      .select('*')
      .eq('referrer_contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ContractorReferral[];
  },

  /**
   * Update referral status when contractor signs up
   */
  async updateReferralStatus(referralId: string, status: ContractorReferral['status']) {
    const updates: Partial<ContractorReferral> = { status };

    if (status === 'signed_up') {
      updates.signed_up_at = new Date().toISOString();
    } else if (status === 'onboarded') {
      updates.onboarded_at = new Date().toISOString();
    } else if (status === 'earned_credit') {
      updates.credit_applied = true;
      updates.credit_applied_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('contractor_referrals')
      .update(updates)
      .eq('id', referralId)
      .select()
      .single();

    if (error) throw error;
    return data as ContractorReferral;
  },

  /**
   * Bulk import contractor leads (e.g., from Clay.com)
   */
  async bulkImportLeads(leads: Partial<ContractorLead>[]) {
    const { data, error } = await supabase
      .from('contractor_leads')
      .insert(leads as any)
      .select();

    if (error) throw error;
    return data as ContractorLead[];
  },

  /**
   * Get contractor acquisition stats
   */
  async getAcquisitionStats() {
    const { data: leads, error: leadsError } = await supabase
      .from('contractor_leads')
      .select('outreach_status, quality_score');

    if (leadsError) throw leadsError;

    const stats = {
      total: leads?.length || 0,
      new: leads?.filter(l => l.outreach_status === 'new').length || 0,
      contacted: leads?.filter(l => l.outreach_status === 'contacted').length || 0,
      scheduled: leads?.filter(l => l.outreach_status === 'scheduled').length || 0,
      onboarded: leads?.filter(l => l.outreach_status === 'onboarded').length || 0,
      rejected: leads?.filter(l => l.outreach_status === 'rejected').length || 0,
      highQuality: leads?.filter(l => (l.quality_score || 0) >= 80).length || 0,
      mediumQuality: leads?.filter(l => (l.quality_score || 0) >= 60 && (l.quality_score || 0) < 80).length || 0,
      lowQuality: leads?.filter(l => (l.quality_score || 0) < 60).length || 0,
    };

    return stats;
  },
};

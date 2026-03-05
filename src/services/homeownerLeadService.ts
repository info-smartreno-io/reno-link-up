import { supabase } from "@/integrations/supabase/client";
import { getAttributionSummary, trackIntakeStep, trackConversion } from "@/utils/leadTracking";
import type { HomeownerLead } from "@/types/contractor-acquisition";

export const homeownerLeadService = {
  /**
   * Create a new homeowner lead with full attribution tracking
   */
  async createLead(leadData: {
    project_type: string;
    name?: string;
    email?: string;
    phone?: string;
    zip_code?: string;
    estimated_budget?: string;
    timeline?: string;
    description?: string;
  }) {
    // Get attribution data from tracking cookie
    const attribution = getAttributionSummary();

    const { data, error } = await supabase
      .from('homeowner_leads')
      .insert([{
        ...leadData,
        ...attribution,
        status: 'new_lead',
      }])
      .select()
      .single();

    if (error) throw error;

    // Track conversion
    trackConversion('lead_submitted');

    return data as any as HomeownerLead;
  },

  /**
   * Update homeowner lead
   */
  async updateLead(leadId: string, updates: Partial<HomeownerLead>) {
    const { data, error } = await supabase
      .from('homeowner_leads')
      .update(updates as any)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return data as any as HomeownerLead;
  },

  /**
   * Track intake form step completion
   */
  async trackStep(leadId: string, step: string) {
    // Update cookie tracking
    trackIntakeStep(step);

    // Get current lead
    const { data: lead } = await supabase
      .from('homeowner_leads')
      .select('completed_steps')
      .eq('id', leadId)
      .single();

    if (lead) {
      const currentSteps = Array.isArray(lead.completed_steps) ? lead.completed_steps : [];
      const steps = [...currentSteps, step];
      
      await supabase
        .from('homeowner_leads')
        .update({ completed_steps: steps } as any)
        .eq('id', leadId);
    }
  },

  /**
   * Get lead by ID
   */
  async getLead(leadId: string) {
    const { data, error } = await supabase
      .from('homeowner_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data as any as HomeownerLead;
  },

  /**
   * Get all leads with filters
   */
  async getLeads(filters?: {
    status?: string;
    lead_source?: string;
    county?: string;
  }) {
    let query = supabase
      .from('homeowner_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.lead_source) {
      query = query.eq('lead_source', filters.lead_source);
    }

    if (filters?.county) {
      query = query.eq('county', filters.county);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as any as HomeownerLead[];
  },

  /**
   * Get lead attribution analytics
   */
  async getAttributionStats(dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('homeowner_leads')
      .select('lead_source, utm_source, utm_campaign, status, created_at');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by lead source
    const sourceStats = data?.reduce((acc, lead) => {
      const source = lead.lead_source || 'unknown';
      if (!acc[source]) {
        acc[source] = {
          count: 0,
          converted: 0,
          sources: [],
        };
      }
      acc[source].count++;
      if (lead.status === 'converted') {
        acc[source].converted++;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      by_source: sourceStats,
      total: data?.length || 0,
      converted: data?.filter(l => l.status === 'converted').length || 0,
    };
  },
};

/**
 * Marketing Analytics Service
 * Provides analytics and metrics for marketing dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export interface SourceBreakdown {
  source: string;
  count: number;
  qualified: number;
  sold: number;
  closeRate: number;
}

export interface TownPerformance {
  town: string;
  leads: number;
  qualified: number;
  sold: number;
  closeRate: number;
}

export interface ServiceTypePerformance {
  serviceType: string;
  leads: number;
  avgValue: number;
  closeRate: number;
}

export interface LeadFunnelMetrics {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  sold: number;
  lost: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

const SOLD_STATUSES = ['bid_accepted', 'project_started', 'project_completed'];
const QUALIFIED_STATUSES = ['walkthrough', 'scope_sent', 'bid_room', 'bid_accepted', 'project_started', 'project_completed'];
const LOST_STATUSES = ['lost', 'closed_lost', 'not_interested'];

/**
 * Normalize source values for consistent grouping
 */
function normalizeSource(source: string | null): string {
  if (!source) return 'other';
  
  const lowerSource = source.toLowerCase();
  
  if (lowerSource.includes('google') || lowerSource === 'organic' || lowerSource === 'paid_search') {
    return 'google';
  }
  if (lowerSource.includes('facebook') || lowerSource === 'fb') {
    return 'facebook';
  }
  if (lowerSource.includes('instagram') || lowerSource === 'ig') {
    return 'instagram';
  }
  if (lowerSource.includes('referral') || lowerSource === 'word_of_mouth') {
    return 'referral';
  }
  
  return 'other';
}

export const marketingAnalyticsService = {
  /**
   * Get leads grouped by source
   */
  async getLeadsBySource(dateRange?: DateRange): Promise<SourceBreakdown[]> {
    let query = supabase
      .from('leads')
      .select('source, status');
    
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group by normalized source
    const sourceMap = new Map<string, { count: number; qualified: number; sold: number }>();
    
    (data || []).forEach(lead => {
      const source = normalizeSource(lead.source);
      const existing = sourceMap.get(source) || { count: 0, qualified: 0, sold: 0 };
      
      existing.count++;
      if (QUALIFIED_STATUSES.includes(lead.status || '')) {
        existing.qualified++;
      }
      if (SOLD_STATUSES.includes(lead.status || '')) {
        existing.sold++;
      }
      
      sourceMap.set(source, existing);
    });
    
    return Array.from(sourceMap.entries()).map(([source, stats]) => ({
      source,
      count: stats.count,
      qualified: stats.qualified,
      sold: stats.sold,
      closeRate: stats.count > 0 ? Math.round((stats.sold / stats.count) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  },

  /**
   * Get leads grouped by town/location
   */
  async getLeadsByTown(dateRange?: DateRange): Promise<TownPerformance[]> {
    let query = supabase
      .from('leads')
      .select('location, status');
    
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const townMap = new Map<string, { leads: number; qualified: number; sold: number }>();
    
    (data || []).forEach(lead => {
      const town = lead.location || 'Unknown';
      const existing = townMap.get(town) || { leads: 0, qualified: 0, sold: 0 };
      
      existing.leads++;
      if (QUALIFIED_STATUSES.includes(lead.status || '')) {
        existing.qualified++;
      }
      if (SOLD_STATUSES.includes(lead.status || '')) {
        existing.sold++;
      }
      
      townMap.set(town, existing);
    });
    
    return Array.from(townMap.entries()).map(([town, stats]) => ({
      town,
      leads: stats.leads,
      qualified: stats.qualified,
      sold: stats.sold,
      closeRate: stats.leads > 0 ? Math.round((stats.sold / stats.leads) * 100) : 0,
    })).sort((a, b) => b.leads - a.leads);
  },

  /**
   * Get leads grouped by service/project type
   */
  async getLeadsByServiceType(dateRange?: DateRange): Promise<ServiceTypePerformance[]> {
    let query = supabase
      .from('leads')
      .select('project_type, status, estimated_budget');
    
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const serviceMap = new Map<string, { leads: number; totalValue: number; valueCount: number; sold: number }>();
    
    (data || []).forEach(lead => {
      const serviceType = lead.project_type || 'Other';
      const existing = serviceMap.get(serviceType) || { leads: 0, totalValue: 0, valueCount: 0, sold: 0 };
      
      existing.leads++;
      
      // Parse budget value
      if (lead.estimated_budget) {
        const budgetValue = parseFloat(lead.estimated_budget.replace(/[^0-9.]/g, ''));
        if (!isNaN(budgetValue)) {
          existing.totalValue += budgetValue;
          existing.valueCount++;
        }
      }
      
      if (SOLD_STATUSES.includes(lead.status || '')) {
        existing.sold++;
      }
      
      serviceMap.set(serviceType, existing);
    });
    
    return Array.from(serviceMap.entries()).map(([serviceType, stats]) => ({
      serviceType,
      leads: stats.leads,
      avgValue: stats.valueCount > 0 ? Math.round(stats.totalValue / stats.valueCount) : 0,
      closeRate: stats.leads > 0 ? Math.round((stats.sold / stats.leads) * 100) : 0,
    })).sort((a, b) => b.leads - a.leads);
  },

  /**
   * Get lead funnel metrics
   */
  async getLeadFunnelMetrics(dateRange?: DateRange): Promise<LeadFunnelMetrics> {
    let query = supabase
      .from('leads')
      .select('status');
    
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const leads = data || [];
    
    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'new_lead').length,
      contacted: leads.filter(l => l.status === 'call_24h' || l.status === 'contacted').length,
      qualified: leads.filter(l => QUALIFIED_STATUSES.includes(l.status || '')).length,
      sold: leads.filter(l => SOLD_STATUSES.includes(l.status || '')).length,
      lost: leads.filter(l => LOST_STATUSES.includes(l.status || '')).length,
    };
  },

  /**
   * Get leads for the activity table with filters
   */
  async getLeadActivity(filters?: {
    source?: string;
    town?: string;
    status?: string;
    dateRange?: DateRange;
    limit?: number;
  }) {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.source && filters.source !== 'all') {
      query = query.ilike('source', `%${filters.source}%`);
    }
    
    if (filters?.town && filters.town !== 'all') {
      query = query.ilike('location', `%${filters.town}%`);
    }
    
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString());
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  },

  /**
   * Get weekly and monthly lead counts
   */
  async getLeadCounts() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [weeklyResult, monthlyResult] = await Promise.all([
      supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString()),
      supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .gte('created_at', monthAgo.toISOString()),
    ]);
    
    return {
      thisWeek: weeklyResult.count || 0,
      thisMonth: monthlyResult.count || 0,
    };
  },
};

/**
 * Marketing Automation Rules
 * Define source-based routing and automation rules
 */

export interface MarketingAutomationConditions {
  source?: string | string[];
  channel?: string | string[];
  town?: string | string[];
  serviceType?: string | string[];
}

export interface MarketingAutomationActions {
  addTags?: string[];
  assignPriority?: 'high' | 'medium' | 'low';
  notifyRoles?: string[];
  applyScript?: string;
  assignToRole?: string;
  shortenSLA?: boolean;
}

export interface MarketingAutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  conditions: MarketingAutomationConditions;
  actions: MarketingAutomationActions;
}

/**
 * Pre-defined marketing automation rules
 * These define how leads from different sources should be handled
 */
export const MARKETING_AUTOMATION_RULES: MarketingAutomationRule[] = [
  {
    id: 'fb-group-priority',
    name: 'Facebook Group Priority',
    description: 'High-intent leads from Facebook community groups get priority handling',
    isActive: true,
    conditions: { 
      source: 'facebook', 
      channel: 'group' 
    },
    actions: { 
      addTags: ['FB-GROUP', 'COMMUNITY'],
      assignPriority: 'high',
      notifyRoles: ['inside_sales'],
      applyScript: 'facebook-group-followup'
    }
  },
  {
    id: 'google-lsa-high-intent',
    name: 'Google LSA High Intent',
    description: 'Google Local Services leads are high-intent and need immediate response',
    isActive: true,
    conditions: { 
      source: 'google', 
      channel: 'lsa' 
    },
    actions: { 
      addTags: ['HIGH-INTENT', 'LSA', 'GOOGLE'],
      assignPriority: 'high',
      notifyRoles: ['estimator', 'inside_sales'],
      shortenSLA: true
    }
  },
  {
    id: 'google-search-ads',
    name: 'Google Search Ads',
    description: 'Paid search leads with good conversion potential',
    isActive: true,
    conditions: { 
      source: 'google', 
      channel: 'search' 
    },
    actions: { 
      addTags: ['PAID', 'GOOGLE-ADS'],
      assignPriority: 'medium',
      notifyRoles: ['inside_sales']
    }
  },
  {
    id: 'architect-referral',
    name: 'Architect Referral',
    description: 'Referrals from architects are pre-qualified and high-value',
    isActive: true,
    conditions: { 
      source: 'referral'
    },
    actions: { 
      addTags: ['REFERRAL', 'PRE-QUALIFIED'],
      assignPriority: 'high',
      notifyRoles: ['estimator'],
      assignToRole: 'estimator'
    }
  },
  {
    id: 'instagram-organic',
    name: 'Instagram Organic',
    description: 'Instagram profile visits and DMs',
    isActive: true,
    conditions: { 
      source: 'instagram', 
      channel: 'organic' 
    },
    actions: { 
      addTags: ['SOCIAL', 'INSTAGRAM'],
      assignPriority: 'medium',
      notifyRoles: ['inside_sales']
    }
  },
  {
    id: 'large-project-escalation',
    name: 'Large Project Escalation',
    description: 'Home additions and large remodels get estimator attention',
    isActive: true,
    conditions: { 
      serviceType: ['home_addition', 'whole_home_remodel', 'major_renovation']
    },
    actions: { 
      addTags: ['LARGE-PROJECT', 'PRIORITY'],
      assignPriority: 'high',
      notifyRoles: ['estimator', 'contractor'],
      assignToRole: 'estimator'
    }
  }
];

/**
 * Get matching automation rules for a lead
 */
export function getMatchingRules(lead: {
  source?: string | null;
  channel?: string | null;
  location?: string | null;
  project_type?: string | null;
}): MarketingAutomationRule[] {
  return MARKETING_AUTOMATION_RULES.filter(rule => {
    if (!rule.isActive) return false;
    
    const { conditions } = rule;
    
    // Check source match
    if (conditions.source) {
      const sources = Array.isArray(conditions.source) ? conditions.source : [conditions.source];
      if (!sources.some(s => lead.source?.toLowerCase().includes(s.toLowerCase()))) {
        return false;
      }
    }
    
    // Check channel match
    if (conditions.channel) {
      const channels = Array.isArray(conditions.channel) ? conditions.channel : [conditions.channel];
      if (!channels.some(c => lead.channel?.toLowerCase() === c.toLowerCase())) {
        return false;
      }
    }
    
    // Check town match
    if (conditions.town) {
      const towns = Array.isArray(conditions.town) ? conditions.town : [conditions.town];
      if (!towns.some(t => lead.location?.toLowerCase().includes(t.toLowerCase()))) {
        return false;
      }
    }
    
    // Check service type match
    if (conditions.serviceType) {
      const types = Array.isArray(conditions.serviceType) ? conditions.serviceType : [conditions.serviceType];
      if (!types.some(t => lead.project_type?.toLowerCase() === t.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Merge actions from multiple matching rules
 */
export function mergeRuleActions(rules: MarketingAutomationRule[]): MarketingAutomationActions {
  const merged: MarketingAutomationActions = {
    addTags: [],
    assignPriority: 'low',
    notifyRoles: [],
  };
  
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  
  rules.forEach(rule => {
    // Merge tags
    if (rule.actions.addTags) {
      merged.addTags = [...new Set([...(merged.addTags || []), ...rule.actions.addTags])];
    }
    
    // Take highest priority
    if (rule.actions.assignPriority) {
      const currentPriority = priorityOrder[merged.assignPriority || 'low'];
      const newPriority = priorityOrder[rule.actions.assignPriority];
      if (newPriority > currentPriority) {
        merged.assignPriority = rule.actions.assignPriority;
      }
    }
    
    // Merge notification roles
    if (rule.actions.notifyRoles) {
      merged.notifyRoles = [...new Set([...(merged.notifyRoles || []), ...rule.actions.notifyRoles])];
    }
    
    // Take first assignment
    if (rule.actions.assignToRole && !merged.assignToRole) {
      merged.assignToRole = rule.actions.assignToRole;
    }
    
    // Take first script
    if (rule.actions.applyScript && !merged.applyScript) {
      merged.applyScript = rule.actions.applyScript;
    }
    
    // Shorten SLA if any rule says so
    if (rule.actions.shortenSLA) {
      merged.shortenSLA = true;
    }
  });
  
  return merged;
}

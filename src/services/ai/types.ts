export type AgentType = 
  | 'smart_intake'
  | 'estimate_companion'
  | 'homeowner_support'
  | 'scheduling_routing'
  | 'walkthrough'
  | 'smart_estimate'
  | 'bid_preparation'
  | 'contractor_workflow'
  | 'sub_bid'
  | 'timeline'
  | 'communication'
  | 'qa'
  | 'permit'
  | 'warranty';

export type UserRole = 'homeowner' | 'estimator' | 'contractor' | 'subcontractor' | 'pm' | 'admin';

export interface AgentContext {
  userId: string;
  userRole: UserRole;
  projectId?: string;
  additionalData?: Record<string, any>;
}

export interface AgentRequest {
  agentType: AgentType;
  context: AgentContext;
  input: string | Record<string, any>;
  options?: {
    requireApproval?: boolean;
    logActivity?: boolean;
  };
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  message?: string;
  requiresApproval?: boolean;
  approvalData?: any;
  error?: string;
  activityLogId?: string;
}

export interface AgentActivity {
  id: string;
  agent_type: AgentType;
  user_id: string;
  user_role: UserRole;
  project_id?: string;
  input: any;
  output: any;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

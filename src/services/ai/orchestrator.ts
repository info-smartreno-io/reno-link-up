import { supabase } from "@/integrations/supabase/client";
import { AgentRequest, AgentResponse, AgentType, UserRole } from "./types";
import { smartIntakeAgent } from "./agents/smartIntakeAgent";
import { homeownerSupportAgent } from "./agents/homeownerSupportAgent";
import { estimateCompanionAgent } from "./agents/estimateCompanionAgent";

/**
 * Core Agent Orchestrator
 * Routes requests to the appropriate AI agent based on type and context
 */
export class AgentOrchestrator {
  private static async logActivity(
    agentType: AgentType,
    userId: string,
    userRole: UserRole,
    input: any,
    output: any,
    projectId?: string
  ): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_activity')
        .insert({
          agent_type: agentType,
          user_id: userId,
          user_role: userRole,
          project_id: projectId,
          input,
          output,
          status: 'completed'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id;
    } catch (error) {
      console.error('Failed to log agent activity:', error);
      return undefined;
    }
  }

  static async execute(request: AgentRequest): Promise<AgentResponse> {
    const { agentType, context, input, options = {} } = request;
    const { logActivity = true } = options;

    try {
      let result: AgentResponse;

      // Route to appropriate agent based on type
      switch (agentType) {
        case 'smart_intake':
          result = await smartIntakeAgent.process(context, input as any);
          break;
        case 'homeowner_support':
          result = await homeownerSupportAgent.process(context, input as string);
          break;
        case 'estimate_companion':
          result = await estimateCompanionAgent.process(context, input as any);
          break;
        default:
          return {
            success: false,
            error: `Agent type ${agentType} not yet implemented`
          };
      }

      // Log activity if enabled
      if (logActivity && result.success) {
        const activityLogId = await this.logActivity(
          agentType,
          context.userId,
          context.userRole,
          input,
          result.data,
          context.projectId
        );
        result.activityLogId = activityLogId;
      }

      return result;
    } catch (error) {
      console.error(`Agent orchestrator error for ${agentType}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Determine the best agent for a given user context and query
   */
  static async suggestAgent(
    userRole: UserRole,
    query: string,
    context?: Record<string, any>
  ): Promise<AgentType | null> {
    // Simple keyword-based routing for now
    // Could be enhanced with AI classification
    const lowerQuery = query.toLowerCase();

    if (userRole === 'homeowner') {
      if (lowerQuery.includes('cost') || lowerQuery.includes('price') || lowerQuery.includes('budget')) {
        return 'estimate_companion';
      }
      if (lowerQuery.includes('status') || lowerQuery.includes('where') || lowerQuery.includes('when')) {
        return 'homeowner_support';
      }
      if (context?.isIntake) {
        return 'smart_intake';
      }
    }

    if (userRole === 'estimator') {
      if (lowerQuery.includes('schedule') || lowerQuery.includes('route')) {
        return 'scheduling_routing';
      }
      if (lowerQuery.includes('walkthrough') || lowerQuery.includes('photos')) {
        return 'walkthrough';
      }
    }

    return null;
  }
}

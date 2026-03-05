import { supabase } from "@/integrations/supabase/client";
import { AgentContext, AgentResponse } from "../types";

/**
 * Smart Homeowner Support Agent
 * Answers status and process questions using existing project data
 */
class HomeownerSupportAgent {
  async process(
    context: AgentContext,
    input: string
  ): Promise<AgentResponse> {
    try {
      // Gather relevant project context
      const projectContext = await this.gatherProjectContext(context);

      // Call edge function for AI response
      const { data, error } = await supabase.functions.invoke('ai-homeowner-support', {
        body: {
          question: input,
          userId: context.userId,
          projectId: context.projectId,
          projectContext
        }
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          answer: data.answer,
          sources: data.sources,
          escalate: data.shouldEscalate,
          suggestedActions: data.suggestedActions
        },
        message: data.shouldEscalate 
          ? 'Question flagged for human support' 
          : 'Answer generated successfully'
      };
    } catch (error) {
      console.error('Homeowner Support Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process support request'
      };
    }
  }

  private async gatherProjectContext(context: AgentContext): Promise<any> {
    if (!context.projectId) return {};

    try {
      const { data: project } = await supabase
        .from('projects')
        .select(`
          *
        `)
        .eq('id', context.projectId)
        .single();

      // Fetch related data separately
      const { data: estimates } = await supabase.from('estimates').select('*').eq('project_id', context.projectId);
      
      return {
        status: project?.status,
        name: project?.name,
        estimateStatus: estimates?.[0]?.status
      };
    } catch (error) {
      console.error('Failed to gather project context:', error);
      return {};
    }
  }
}

export const homeownerSupportAgent = new HomeownerSupportAgent();

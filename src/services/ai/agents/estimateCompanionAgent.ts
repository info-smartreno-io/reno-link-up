import { supabase } from "@/integrations/supabase/client";
import { AgentContext, AgentResponse } from "../types";

/**
 * Smart Estimate Companion Agent
 * Provides cost ranges and explanations based on project details
 */
class EstimateCompanionAgent {
  async process(
    context: AgentContext,
    input: string | { projectId: string }
  ): Promise<AgentResponse> {
    try {
      const projectId = typeof input === 'string' ? context.projectId : input.projectId;
      
      if (!projectId) {
        throw new Error('Project ID required for estimate companion');
      }

      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) {
        throw new Error('Project not found');
      }

      // Call edge function for cost analysis
      const { data, error } = await supabase.functions.invoke('ai-estimate-companion', {
        body: {
          projectId,
          projectType: project.project_type,
          scope: project.description || '',
          location: 'NJ', // We'll enhance this later with actual location data
          squareFootage: project.square_footage || 0
        }
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          costRanges: {
            low: data.lowEstimate,
            medium: data.mediumEstimate,
            high: data.highEstimate
          },
          explanation: data.explanation,
          costDrivers: data.costDrivers,
          recommendedAddons: data.addons,
          suggestedTimeWindows: data.timeWindows
        },
        message: 'Cost preview generated successfully'
      };
    } catch (error) {
      console.error('Estimate Companion Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate estimate preview'
      };
    }
  }
}

export const estimateCompanionAgent = new EstimateCompanionAgent();

import { supabase } from "@/integrations/supabase/client";
import { AgentContext, AgentResponse } from "../types";

/**
 * Smart Intake Agent
 * Turns homeowner text + photos into structured project records
 */
class SmartIntakeAgent {
  async process(
    context: AgentContext,
    input: string | { description: string; photos?: string[] }
  ): Promise<AgentResponse> {
    try {
      const description = typeof input === 'string' ? input : input.description;
      const photos = typeof input === 'object' ? input.photos : undefined;

      // Call edge function to analyze intake data
      const { data, error } = await supabase.functions.invoke('ai-smart-intake', {
        body: {
          description,
          photos,
          projectId: context.projectId,
          userId: context.userId
        }
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          suggestedProjectType: data.projectType,
          suggestedRooms: data.rooms,
          estimatedSquareFootage: data.squareFootage,
          structuredScope: data.scope,
          detectedNeeds: {
            mechanical: data.needsMechanical,
            electrical: data.needsElectrical,
            plumbing: data.needsPlumbing
          },
          recommendations: data.recommendations
        },
        message: 'Successfully analyzed project intake'
      };
    } catch (error) {
      console.error('Smart Intake Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process intake'
      };
    }
  }
}

export const smartIntakeAgent = new SmartIntakeAgent();

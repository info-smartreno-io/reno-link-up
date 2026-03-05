import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateTimelineRequest {
  projectId: string;
  scopeOfWork: string;
  projectType: string;
  startDate?: string;
  estimatedDuration?: number; // in weeks
}

interface Task {
  task_name: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
  color: string;
  order_index: number;
}

interface Milestone {
  milestone_name: string;
  milestone_date: string;
  milestone_type: string;
  description: string;
  icon_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { projectId, scopeOfWork, projectType, startDate, estimatedDuration }: GenerateTimelineRequest = await req.json();

    console.log("Generating timeline for project:", projectId);

    // Calculate project dates
    const projectStartDate = startDate ? new Date(startDate) : new Date();
    const projectDurationWeeks = estimatedDuration || 12;
    const projectEndDate = new Date(projectStartDate);
    projectEndDate.setDate(projectEndDate.getDate() + (projectDurationWeeks * 7));

    // Create AI prompt for timeline generation
    const systemPrompt = `You are an expert construction project manager specializing in residential renovations. 
Your task is to generate a realistic project timeline with tasks and milestones based on the scope of work.

Consider standard construction sequences, dependencies, and realistic durations for each phase.
Include appropriate milestones for trade work, material deliveries, inspections, and major project phases.`;

    const userPrompt = `Generate a detailed project timeline for the following renovation project:

Project Type: ${projectType}
Project Duration: ${projectDurationWeeks} weeks
Start Date: ${projectStartDate.toISOString().split('T')[0]}
End Date: ${projectEndDate.toISOString().split('T')[0]}

Scope of Work:
${scopeOfWork}

Create a comprehensive timeline with:
1. Major project phases (Planning, Demolition, Construction, Finishing, etc.)
2. Specific tasks for each phase
3. Milestones for trade work (electrical, plumbing, HVAC, etc.)
4. Material delivery milestones
5. Inspection points
6. Project completion milestone

Ensure tasks are sequential and realistic, with appropriate durations and dependencies.`;

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_project_timeline",
              description: "Generate a complete project timeline with tasks and milestones",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_name: { type: "string", description: "Name of the task" },
                        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
                        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
                        progress: { type: "number", description: "Initial progress (0-100)" },
                        status: { type: "string", enum: ["pending", "in_progress", "completed"], description: "Task status" },
                        color: { type: "string", description: "Hex color code for the task bar" },
                        order_index: { type: "number", description: "Order of task in the timeline" }
                      },
                      required: ["task_name", "start_date", "end_date", "progress", "status", "color", "order_index"],
                      additionalProperties: false
                    }
                  },
                  milestones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        milestone_name: { type: "string", description: "Name of the milestone" },
                        milestone_date: { type: "string", description: "Date in YYYY-MM-DD format" },
                        milestone_type: { type: "string", enum: ["trade", "delivery", "inspection", "major"], description: "Type of milestone" },
                        description: { type: "string", description: "Description of what this milestone represents" },
                        icon_name: { type: "string", description: "Icon name (Zap, Droplet, Wind, Hammer, Package, CheckCircle, Flag)" }
                      },
                      required: ["milestone_name", "milestone_date", "milestone_type", "description", "icon_name"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["tasks", "milestones"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_project_timeline" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "generate_project_timeline") {
      throw new Error("AI did not return timeline data");
    }

    const timelineData = JSON.parse(toolCall.function.arguments);
    const { tasks, milestones } = timelineData;

    console.log(`Generated ${tasks.length} tasks and ${milestones.length} milestones`);

    // Insert tasks into database
    const tasksToInsert = tasks.map((task: Task) => ({
      project_id: projectId,
      ...task,
      completed: false,
    }));

    const { error: tasksError } = await supabase
      .from('project_tasks')
      .insert(tasksToInsert);

    if (tasksError) {
      console.error("Error inserting tasks:", tasksError);
      throw new Error(`Failed to insert tasks: ${tasksError.message}`);
    }

    // Insert milestones into database
    const milestonesToInsert = milestones.map((milestone: Milestone) => ({
      project_id: projectId,
      ...milestone,
      completed: false,
    }));

    const { error: milestonesError } = await supabase
      .from('project_milestones')
      .insert(milestonesToInsert);

    if (milestonesError) {
      console.error("Error inserting milestones:", milestonesError);
      throw new Error(`Failed to insert milestones: ${milestonesError.message}`);
    }

    console.log("Timeline generated and saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Timeline generated successfully",
        tasksCount: tasks.length,
        milestonesCount: milestones.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-timeline function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

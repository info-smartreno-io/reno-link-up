import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      projectId,
      scope,
      timeline,
      bids,
      contractors
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const prompt = `You are SmartReno's Knowledge Graph Generator. Create a comprehensive project knowledge graph.

PROJECT ID: ${projectId}

SCOPE:
${JSON.stringify(scope, null, 2)}

TIMELINE:
${JSON.stringify(timeline, null, 2)}

BIDS:
${JSON.stringify(bids, null, 2)}

CONTRACTORS:
${JSON.stringify(contractors, null, 2)}

Generate a knowledge graph with:
- Nodes: rooms, trades, subtasks, materials, contractors, milestones, risk factors
- Edges: dependencies, assignments, material requirements, blocking relationships

Provide a JSON response with:
{
  "nodes": [
    {
      "id": "unique_id",
      "type": "room|trade|material|contractor|milestone|risk",
      "label": "Name",
      "properties": {}
    }
  ],
  "edges": [
    {
      "from": "node_id",
      "to": "node_id",
      "type": "depends_on|delayed_by|assigned_to|requires|blocks",
      "properties": {}
    }
  ],
  "summary": "Brief description of the knowledge graph"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a construction project knowledge graph AI. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let result = data.choices[0].message.content;

    if (result.startsWith("```json")) {
      result = result.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    const graph = JSON.parse(result);

    // Store knowledge graph
    const { data: knowledgeGraph, error: graphError } = await supabase
      .from("knowledge_graphs")
      .insert({
        project_id: projectId,
        nodes: graph.nodes || [],
        edges: graph.edges || [],
        summary: graph.summary || "Project knowledge graph"
      })
      .select()
      .single();

    if (graphError) throw graphError;

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "project_graph_generator",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        scope,
        timeline,
        bidsCount: bids?.length || 0
      },
      output: {
        nodes: graph.nodes?.length || 0,
        edges: graph.edges?.length || 0,
        graphId: knowledgeGraph.id,
        summary: graph.summary
      },
      status: "completed"
    });

    console.log("Knowledge graph created for project:", projectId);

    return new Response(
      JSON.stringify({
        nodes: graph.nodes?.length || 0,
        edges: graph.edges?.length || 0,
        graphId: knowledgeGraph.id,
        summary: graph.summary
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-project-graph-generator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

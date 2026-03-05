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
      estimate,
      bid,
      lineItems,
      projectId
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const embeddedLineItems: string[] = [];

    // Embed each line item
    for (const item of lineItems || []) {
      const itemText = `${item.description || item.item_name}: ${item.quantity} ${item.unit || 'units'} @ $${item.unit_cost || item.price}`;
      
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-large",
          input: itemText,
          dimensions: 1536
        }),
      });

      if (!embeddingResponse.ok) continue;

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Store line item embedding
      const { data: vectorDoc } = await supabase
        .from("vector_docs")
        .insert({
          project_id: projectId,
          document_type: "estimate_line_item",
          portal: "estimator",
          chunk: itemText,
          embedding: embedding,
          metadata: {
            estimate_id: estimate?.id,
            bid_id: bid?.id,
            item: item
          }
        })
        .select()
        .single();

      if (vectorDoc) embeddedLineItems.push(vectorDoc.id);
    }

    // Find similar past projects using vector similarity
    const firstItemEmbedding = embeddedLineItems.length > 0 ? 
      (await supabase.from("vector_docs").select("embedding").eq("id", embeddedLineItems[0]).single()).data?.embedding 
      : null;

    let similarProjects: string[] = [];
    if (firstItemEmbedding) {
      // This would use pgvector's similarity search in production
      // For now, return empty array
      similarProjects = [];
    }

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "estimate_embedding_pipeline",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        estimateId: estimate?.id,
        bidId: bid?.id,
        lineItemsCount: lineItems?.length || 0
      },
      output: {
        embedded_line_items: embeddedLineItems.length,
        similar_past_projects: similarProjects,
        pricing_outliers: []
      },
      status: "completed",
      embedding_ids: embeddedLineItems
    });

    console.log("Estimate embedded for project:", projectId);

    return new Response(
      JSON.stringify({
        embedded_line_items: embeddedLineItems.length,
        similar_past_projects: similarProjects,
        pricing_outliers: []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-estimate-embedding-pipeline:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

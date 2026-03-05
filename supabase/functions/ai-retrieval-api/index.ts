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
      query,
      projectId,
      contextType // "estimate" | "bid" | "timeline" | "messages" | "SOP" | "all"
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!OPENAI_API_KEY || !LOVABLE_API_KEY) {
      throw new Error("API keys not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Generate query embedding
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-large",
        input: query,
        dimensions: 1536
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error("Failed to generate query embedding");
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Build filter based on context type
    let vectorQuery = supabase
      .from("vector_docs")
      .select("*");

    if (projectId) {
      vectorQuery = vectorQuery.eq("project_id", projectId);
    }

    if (contextType && contextType !== "all") {
      vectorQuery = vectorQuery.eq("document_type", contextType);
    }

    // Note: In production, this would use pgvector's similarity search
    // For now, we'll get recent docs and use AI to find best match
    const { data: docs, error: docsError } = await vectorQuery.limit(10);

    if (docsError) throw docsError;

    // Use AI to find best answer from retrieved docs
    const contextText = docs?.map(d => d.chunk).join('\n\n') || '';

    const aiPrompt = `You are SmartReno's AI retrieval assistant. Answer the following query using ONLY the provided context.

QUERY: ${query}

CONTEXT:
${contextText}

Provide a JSON response with:
{
  "best_answer": "Your answer",
  "sources": ["source1", "source2"],
  "confidence": 0.0-1.0
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a construction project knowledge retrieval AI. Always respond with valid JSON." },
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI retrieval failed");
    }

    const aiData = await aiResponse.json();
    let result = aiData.choices[0].message.content;

    if (result.startsWith("```json")) {
      result = result.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    const answer = JSON.parse(result);

    // Log retrieval query
    await supabase.from("ai_agent_activity").insert({
      agent_type: "retrieval_api",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        query,
        contextType
      },
      output: answer,
      status: "completed",
      retrieval_queries: [query],
      retrieval_scores: [answer.confidence]
    });

    console.log("Retrieval query processed:", query);

    return new Response(
      JSON.stringify(answer),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-retrieval-api:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

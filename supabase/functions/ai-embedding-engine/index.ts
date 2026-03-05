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
      documentId,
      projectId,
      portal,
      documentType,
      content
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

    // Generate embedding using OpenAI
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-large",
        input: content,
        dimensions: 1536
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("OpenAI embedding error:", embeddingResponse.status, errorText);
      throw new Error(`OpenAI embedding error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    const tokenCount = embeddingData.usage.total_tokens;

    // Store in vector_docs table
    const { data: vectorDoc, error: vectorError } = await supabase
      .from("vector_docs")
      .insert({
        project_id: projectId,
        document_type: documentType,
        portal: portal || "admin",
        chunk: content,
        embedding: embedding,
        metadata: {
          document_id: documentId,
          token_count: tokenCount,
          created_by: user.id
        }
      })
      .select()
      .single();

    if (vectorError) throw vectorError;

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "embedding_engine",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        documentType,
        contentLength: content.length
      },
      output: {
        status: "embedded",
        embedding_id: vectorDoc.id,
        token_count: tokenCount
      },
      status: "completed",
      embedding_ids: [vectorDoc.id]
    });

    console.log("Document embedded:", vectorDoc.id);

    return new Response(
      JSON.stringify({
        status: "embedded",
        embedding_id: vectorDoc.id,
        token_count: tokenCount,
        document_type: documentType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-embedding-engine:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

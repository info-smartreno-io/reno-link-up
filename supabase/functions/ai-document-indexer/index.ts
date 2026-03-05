import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunking helper function
function chunkText(text: string, maxTokens: number = 1000): string[] {
  // Simple chunking by characters (approximately 4 chars per token)
  const maxChars = maxTokens * 4;
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split('\n\n');
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // If single paragraph is too long, split by sentences
      if (paragraph.length > maxChars) {
        const sentences = paragraph.split(/[.!?]+\s/);
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChars) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks.filter(c => c.length > 0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      documentId,
      projectId,
      content,
      documentType
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

    // Chunk the document
    const chunks = chunkText(content);

    // Create embedding job
    const { data: job, error: jobError } = await supabase
      .from("embedding_jobs")
      .insert({
        document_id: documentId,
        project_id: projectId,
        document_type: documentType,
        status: "processing",
        chunks_created: chunks.length
      })
      .select()
      .single();

    if (jobError) throw jobError;

    const chunkIds: string[] = [];

    // Embed each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-large",
          input: chunk,
          dimensions: 1536
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding failed for chunk ${i}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Store chunk with embedding
      const { data: vectorDoc, error: vectorError } = await supabase
        .from("vector_docs")
        .insert({
          project_id: projectId,
          document_type: documentType,
          portal: "admin",
          chunk: chunk,
          embedding: embedding,
          metadata: {
            document_id: documentId,
            chunk_index: i,
            total_chunks: chunks.length,
            job_id: job.id
          }
        })
        .select()
        .single();

      if (vectorError) throw vectorError;
      chunkIds.push(vectorDoc.id);
    }

    // Update job status
    await supabase
      .from("embedding_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", job.id);

    // Log activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "document_indexer",
      user_id: user.id,
      user_role: "admin",
      project_id: projectId,
      input: {
        documentId,
        documentType,
        contentLength: content.length
      },
      output: {
        chunks_created: chunks.length,
        indexed: true,
        chunk_ids: chunkIds
      },
      status: "completed",
      embedding_ids: chunkIds
    });

    console.log("Document indexed:", documentId, "- chunks:", chunks.length);

    return new Response(
      JSON.stringify({
        chunks_created: chunks.length,
        indexed: true,
        chunk_ids: chunkIds,
        documentType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-document-indexer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

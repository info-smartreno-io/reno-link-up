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
      sopType, // "pm_workflow" | "estimator_guidelines" | "contractor_onboarding" | "warranty_handling" | "communication_standards"
      content,
      title
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

    // Format SOP entry
    const sopText = `[SOP: ${sopType}]\n${title}\n\n${content}`;

    // Generate embedding
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-large",
        input: sopText,
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

    // Store SOP embedding
    const { data: vectorDoc, error: vectorError } = await supabase
      .from("vector_docs")
      .insert({
        project_id: null,
        document_type: "admin_sop",
        portal: "admin",
        chunk: sopText,
        embedding: embedding,
        metadata: {
          sop_type: sopType,
          title: title,
          created_by: user.id
        }
      })
      .select()
      .single();

    if (vectorError) throw vectorError;

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "admin_sop_embedder",
      user_id: user.id,
      user_role: "admin",
      project_id: null,
      input: {
        sopType,
        title,
        contentLength: content.length
      },
      output: {
        embedding_id: vectorDoc.id,
        success: true
      },
      status: "completed",
      embedding_ids: [vectorDoc.id]
    });

    console.log("SOP embedded:", title);

    return new Response(
      JSON.stringify({
        embedding_id: vectorDoc.id,
        success: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-admin-sop-embedder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

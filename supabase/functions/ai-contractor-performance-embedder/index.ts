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
      contractorId,
      performanceData,
      projectHistory,
      warrantyClaims
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

    // Create performance summary text
    const performanceSummary = `
Contractor Performance Summary:
- Projects Completed: ${projectHistory?.length || 0}
- Average Rating: ${performanceData?.avg_rating || 'N/A'}
- On-Time Completion Rate: ${performanceData?.on_time_rate || 'N/A'}
- Warranty Claims: ${warrantyClaims?.length || 0}
- Specialties: ${performanceData?.specialties?.join(', ') || 'N/A'}
- Budget Adherence: ${performanceData?.budget_adherence || 'N/A'}
    `.trim();

    // Generate embedding
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-large",
        input: performanceSummary,
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

    // Store contractor performance embedding
    const { data: vectorDoc, error: vectorError } = await supabase
      .from("vector_docs")
      .insert({
        project_id: null, // Not project-specific
        document_type: "contractor_performance",
        portal: "admin",
        chunk: performanceSummary,
        embedding: embedding,
        metadata: {
          contractor_id: contractorId,
          performance_data: performanceData,
          projects_count: projectHistory?.length || 0,
          warranty_claims_count: warrantyClaims?.length || 0
        }
      })
      .select()
      .single();

    if (vectorError) throw vectorError;

    // Log to ai_agent_activity
    await supabase.from("ai_agent_activity").insert({
      agent_type: "contractor_performance_embedder",
      user_id: user.id,
      user_role: "admin",
      project_id: null,
      input: {
        contractorId,
        projectHistoryCount: projectHistory?.length || 0
      },
      output: {
        performance_vector_id: vectorDoc.id,
        embedding_success: true
      },
      status: "completed",
      embedding_ids: [vectorDoc.id]
    });

    console.log("Contractor performance embedded:", contractorId);

    return new Response(
      JSON.stringify({
        performance_vector_id: vectorDoc.id,
        embedding_success: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-contractor-performance-embedder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

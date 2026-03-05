import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IncomingCandidate {
  full_name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  role_applied: string;
  estimator_trade_specialty?: string;
  years_experience?: string;
  availability?: string;
  why_join?: string;
  portfolio_link?: string;
  linkedin_url?: string;
  resume_url?: string;
  source: string;
  candidate_id?: string; // External reference ID from All-In-One
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract API key from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing or invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("id, contractor_id, organization_name, is_active")
      .eq("api_key", apiKey)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      console.error("Invalid API key:", keyError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyData.id);

    // Parse incoming candidate data
    const candidateData: IncomingCandidate = await req.json();

    console.log(`Receiving candidate from ${keyData.organization_name}:`, {
      name: candidateData.full_name,
      email: candidateData.email,
      role: candidateData.role_applied,
      source: candidateData.source
    });

    // Validate required fields
    if (!candidateData.full_name || !candidateData.email || !candidateData.role_applied) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: full_name, email, role_applied" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build description from available data
    const descriptionParts: string[] = [];
    if (candidateData.why_join) {
      descriptionParts.push(`Why they want to join: ${candidateData.why_join}`);
    }
    if (candidateData.availability) {
      descriptionParts.push(`Availability: ${candidateData.availability}`);
    }
    if (candidateData.city && candidateData.state) {
      descriptionParts.push(`Location: ${candidateData.city}, ${candidateData.state}`);
    }
    const description = descriptionParts.length > 0 
      ? descriptionParts.join("\n\n") 
      : `Application from ${candidateData.source || 'external source'}`;

    // Insert candidate into job_applications table
    const { data: application, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        name: candidateData.full_name,
        email: candidateData.email,
        phone: candidateData.phone,
        role: candidateData.role_applied,
        description: description,
        resume_url: candidateData.resume_url || '',
        linkedin_url: candidateData.linkedin_url,
        portfolio_url: candidateData.portfolio_link,
        status: "new",
        source: candidateData.source || keyData.organization_name,
        source_api_key_id: keyData.id,
        external_candidate_id: candidateData.candidate_id,
        city: candidateData.city,
        state: candidateData.state,
        years_experience: candidateData.years_experience,
        availability: candidateData.availability,
        trade_specialty: candidateData.estimator_trade_specialty,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to insert candidate:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create application", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Candidate application ${application.id} created successfully from ${keyData.organization_name}`);

    // Create notification for HR/admin team
    // Get admin users to notify
    const { data: adminUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(5);

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map((admin) => ({
        user_id: admin.user_id,
        title: "New Job Application Received",
        message: `${candidateData.full_name} applied for ${candidateData.role_applied} from ${candidateData.source || keyData.organization_name}`,
        type: "candidate",
        link: `/admin/careers/applications/${application.id}`,
        read: false,
      }));

      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Failed to create notifications:", notifError);
        // Don't fail the request, just log the error
      } else {
        console.log(`Notifications created for ${adminUsers.length} admin users`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        application_id: application.id,
        message: "Candidate application received successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in receive-candidate:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

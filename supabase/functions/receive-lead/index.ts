import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IncomingLead {
  full_name: string;
  email: string;
  phone: string;
  city_zip: string;
  project_type: string;
  budget_range: string;
  desired_timeline: string;
  description: string | null;
  photo_urls: string[];
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

    // Parse incoming lead data
    const leadData: IncomingLead = await req.json();

    console.log(`Receiving lead from ${keyData.organization_name}:`, {
      name: leadData.full_name,
      email: leadData.email,
      project_type: leadData.project_type,
      contractor_id: keyData.contractor_id
    });

    // Build notes with timeline and description
    const noteParts: string[] = [];
    if (leadData.desired_timeline) {
      noteParts.push(`Timeline: ${leadData.desired_timeline}`);
    }
    if (leadData.description) {
      noteParts.push(`Description: ${leadData.description}`);
    }
    if (leadData.photo_urls && leadData.photo_urls.length > 0) {
      noteParts.push(`Photo URLs: ${leadData.photo_urls.join(", ")}`);
    }
    const notes = noteParts.length > 0 ? noteParts.join("\n\n") : null;

    // Insert lead into database - auto-assign to contractor if API key has one linked
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        name: leadData.full_name,
        email: leadData.email,
        phone: leadData.phone,
        location: leadData.city_zip,
        project_type: leadData.project_type,
        estimated_budget: leadData.budget_range,
        client_notes: notes,
        status: "new_lead",
        source: keyData.organization_name,
        source_api_key_id: keyData.id,
        user_id: keyData.contractor_id, // Auto-assign to linked contractor
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to insert lead:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create lead", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead ${lead.id} created successfully from ${keyData.organization_name}`);

    // Create notification for the contractor if one is linked
    if (keyData.contractor_id) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: keyData.contractor_id,
          title: "New Lead Received",
          message: `${leadData.full_name} submitted a ${leadData.project_type} inquiry from ${keyData.organization_name}`,
          type: "lead",
          link: `/contractor/leads/${lead.id}`,
          read: false,
        });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
        // Don't fail the request, just log the error
      } else {
        console.log(`Notification created for contractor ${keyData.contractor_id}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in receive-lead:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

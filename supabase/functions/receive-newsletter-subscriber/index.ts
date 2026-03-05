import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterSubscriberPayload {
  email: string;
  source?: string;
  subscribed_at?: string;
  type?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      console.error("[receive-newsletter-subscriber] Invalid method:", req.method);
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: Validate API key for security
    const authHeader = req.headers.get("Authorization");
    const expectedApiKey = Deno.env.get("WEBSITE_API_KEY");
    
    if (expectedApiKey && authHeader) {
      const providedKey = authHeader.replace("Bearer ", "");
      if (providedKey !== expectedApiKey) {
        console.error("[receive-newsletter-subscriber] Invalid API key");
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse request body
    const payload: NewsletterSubscriberPayload = await req.json();
    console.log("[receive-newsletter-subscriber] Received payload:", JSON.stringify(payload));

    // Validate required fields
    if (!payload.email) {
      console.error("[receive-newsletter-subscriber] Missing email");
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      console.error("[receive-newsletter-subscriber] Invalid email format:", payload.email);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if subscriber already exists
    const { data: existingSubscriber, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, status")
      .eq("email", payload.email.toLowerCase().trim())
      .maybeSingle();

    if (lookupError) {
      console.error("[receive-newsletter-subscriber] Lookup error:", lookupError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error during lookup" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subscriberId: string;
    let message: string;

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        // Already subscribed and active
        console.log("[receive-newsletter-subscriber] Subscriber already active:", payload.email);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Subscriber already exists",
            subscriber_id: existingSubscriber.id,
            status: "already_subscribed"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Reactivate inactive subscriber
        console.log("[receive-newsletter-subscriber] Reactivating subscriber:", payload.email);
        const { error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({
            status: 'active',
            source: payload.source || "website",
          })
          .eq("id", existingSubscriber.id);

        if (updateError) {
          console.error("[receive-newsletter-subscriber] Reactivation error:", updateError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to reactivate subscriber" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        subscriberId = existingSubscriber.id;
        message = "Subscriber reactivated successfully";
      }
    } else {
      // Insert new subscriber
      console.log("[receive-newsletter-subscriber] Creating new subscriber:", payload.email);
      const { data: newSubscriber, error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: payload.email.toLowerCase().trim(),
          source: payload.source || "website",
          subscribed_at: payload.subscribed_at || new Date().toISOString(),
          status: 'active',
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[receive-newsletter-subscriber] Insert error:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create subscriber" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      subscriberId = newSubscriber.id;
      message = "Subscriber received successfully";
    }

    console.log("[receive-newsletter-subscriber] Success:", { subscriberId, message });

    return new Response(
      JSON.stringify({
        success: true,
        message,
        subscriber_id: subscriberId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[receive-newsletter-subscriber] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

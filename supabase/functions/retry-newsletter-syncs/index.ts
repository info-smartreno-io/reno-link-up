import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[retry-newsletter-syncs] Starting retry job...");

  try {
    // Check if SmartReno integration is configured
    const smartRenoUrl = Deno.env.get("SMARTRENO_PORTAL_URL");
    const smartRenoApiKey = Deno.env.get("SMARTRENO_API_KEY");

    // Gracefully skip if SmartReno is not configured (no external portal)
    if (!smartRenoUrl || !smartRenoApiKey) {
      console.log("[retry-newsletter-syncs] SmartReno integration not configured - skipping sync");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "SmartReno sync disabled - no external portal configured",
          skipped: true,
          processed: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query all subscribers that failed to sync to SmartReno
    // Limit to 50 per run to avoid timeouts
    const { data: failedSubscribers, error: queryError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, source, subscribed_at, sync_retry_count")
      .eq("smartreno_synced", false)
      .lt("sync_retry_count", 5) // Stop after 5 failed attempts
      .order("subscribed_at", { ascending: true })
      .limit(50);

    if (queryError) {
      console.error("[retry-newsletter-syncs] Query error:", queryError);
      return new Response(
        JSON.stringify({ success: false, error: "Database query failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!failedSubscribers || failedSubscribers.length === 0) {
      console.log("[retry-newsletter-syncs] No failed syncs to retry");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No failed syncs to retry",
          processed: 0 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[retry-newsletter-syncs] Found ${failedSubscribers.length} subscribers to retry`);

    let successCount = 0;
    let failCount = 0;
    const results: Array<{ email: string; status: string; error?: string }> = [];

    // Process each failed subscriber
    for (const subscriber of failedSubscribers) {
      const currentRetryCount = subscriber.sync_retry_count || 0;

      try {
        console.log(`[retry-newsletter-syncs] Retrying sync for: ${subscriber.email} (attempt ${currentRetryCount + 1})`);

        // Call SmartReno endpoint
        const response = await fetch(`${smartRenoUrl}/functions/v1/receive-newsletter-subscriber`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${smartRenoApiKey}`,
          },
          body: JSON.stringify({
            email: subscriber.email,
            source: subscriber.source || "website",
            subscribed_at: subscriber.subscribed_at,
            type: "sync_retry",
          }),
        });

        if (response.ok) {
          // Success - update sync status
          const { error: updateError } = await supabase
            .from("newsletter_subscribers")
            .update({
              smartreno_synced: true,
              smartreno_synced_at: new Date().toISOString(),
              last_sync_error: null,
            })
            .eq("id", subscriber.id);

          if (updateError) {
            console.error(`[retry-newsletter-syncs] Failed to update sync status for ${subscriber.email}:`, updateError);
          }

          successCount++;
          results.push({ email: subscriber.email, status: "success" });
          console.log(`[retry-newsletter-syncs] Successfully synced: ${subscriber.email}`);
        } else {
          // Failed - increment retry count and log error
          const errorText = await response.text();
          const errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;

          const { error: updateError } = await supabase
            .from("newsletter_subscribers")
            .update({
              sync_retry_count: currentRetryCount + 1,
              last_sync_error: errorMessage,
            })
            .eq("id", subscriber.id);

          if (updateError) {
            console.error(`[retry-newsletter-syncs] Failed to update retry count for ${subscriber.email}:`, updateError);
          }

          failCount++;
          results.push({ email: subscriber.email, status: "failed", error: errorMessage });
          console.error(`[retry-newsletter-syncs] Failed to sync ${subscriber.email}: ${errorMessage}`);
        }
      } catch (error) {
        // Network or unexpected error
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        const { error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({
            sync_retry_count: currentRetryCount + 1,
            last_sync_error: errorMessage,
          })
          .eq("id", subscriber.id);

        if (updateError) {
          console.error(`[retry-newsletter-syncs] Failed to update retry count for ${subscriber.email}:`, updateError);
        }

        failCount++;
        results.push({ email: subscriber.email, status: "error", error: errorMessage });
        console.error(`[retry-newsletter-syncs] Error syncing ${subscriber.email}:`, error);
      }
    }

    console.log(`[retry-newsletter-syncs] Completed. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${failedSubscribers.length} subscribers`,
        processed: failedSubscribers.length,
        success_count: successCount,
        fail_count: failCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[retry-newsletter-syncs] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

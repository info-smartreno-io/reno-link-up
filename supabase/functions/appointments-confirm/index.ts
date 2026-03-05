import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = await req.json();
    const { appointment_id, final_start, final_end, pm_note } = body;

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: "Missing appointment_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: appt, error: fetchError } = await supabase
      .from("project_appointments")
      .select("*")
      .eq("id", appointment_id)
      .single();

    if (fetchError || !appt) {
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalStartTime = final_start ?? appt.proposed_start ?? appt.requested_start;
    const finalEndTime = final_end ?? appt.proposed_end ?? appt.requested_end ?? finalStartTime;

    const { data, error } = await supabase
      .from("project_appointments")
      .update({
        final_start: finalStartTime,
        final_end: finalEndTime,
        pm_note: pm_note ?? appt.pm_note,
        status: "confirmed",
      })
      .eq("id", appointment_id)
      .select()
      .single();

    if (error) {
      console.error("Confirm error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Appointment confirmed:", appointment_id);

    return new Response(
      JSON.stringify({ appointment: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

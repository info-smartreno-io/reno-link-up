import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = "test-estimator@smartreno.io";
    const password = "Smart2025!!";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existing) {
      userId = existing.id;
      console.log("Test estimator already exists:", userId);
    } else {
      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Test Estimator" },
      });

      if (createError) throw createError;
      userId = newUser.user.id;
      console.log("Created test estimator:", userId);
    }

    // Ensure profile exists
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: "Test Estimator",
      email,
    }, { onConflict: "id" });

    if (profileError) console.error("Profile upsert error:", profileError);

    // Ensure estimator role exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "estimator")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "estimator",
      });
      if (roleError) console.error("Role insert error:", roleError);
    }

    // Ensure estimators table entry exists
    const { data: existingEstimator } = await supabase
      .from("estimators")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingEstimator) {
      const { error: estError } = await supabase.from("estimators").insert({
        user_id: userId,
        display_name: "Test Estimator",
        is_active: true,
        service_zip_codes: ["07452", "07450", "07446"],
        specializations: ["kitchen", "bathroom", "basement"],
        max_assignments: 10,
        current_assignments: 0,
      });
      if (estError) console.error("Estimator insert error:", estError);
    }

    return new Response(
      JSON.stringify({ success: true, userId, message: "Test estimator account ready" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error seeding test estimator:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

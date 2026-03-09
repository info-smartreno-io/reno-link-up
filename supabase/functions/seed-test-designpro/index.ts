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

    const email = "test-designpro@smartreno.io";
    const password = "Smart2025!!";

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existing) {
      userId = existing.id;
      console.log("Test design pro already exists:", userId);
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Test Design Professional" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      console.log("Created test design pro:", userId);
    }

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: "Test Design Professional",
      email,
      profile_completed: true,
    }, { onConflict: "id" });

    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "design_professional")
      .maybeSingle();

    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "design_professional" });
    }

    return new Response(
      JSON.stringify({ success: true, userId, message: "Test design professional account ready" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error seeding test design pro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

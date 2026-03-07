import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const adminEmail = "info@smartreno.io";
    const adminPassword = "Smart2025!!!!";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update password
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "SmartReno Admin" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Ensure profile exists
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: "SmartReno Admin",
      email: adminEmail,
    }, { onConflict: "id" });

    // Assign admin role
    const { error: adminRoleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    // Assign estimator role
    const { error: estimatorRoleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "estimator" }, { onConflict: "user_id,role" });

    // Create test personas
    const testPersonas = [
      { email: "test-contractor@smartreno.io", name: "Test Contractor", role: "contractor" },
      { email: "test-homeowner@smartreno.io", name: "Test Homeowner", role: "homeowner" },
      { email: "test-designer@smartreno.io", name: "Test Designer", role: "interior_designer" },
      { email: "test-architect@smartreno.io", name: "Test Architect", role: "architect" },
    ];

    const createdPersonas = [];

    for (const persona of testPersonas) {
      const existing = existingUsers?.users?.find((u: any) => u.email === persona.email);
      let personaId: string;

      if (existing) {
        personaId = existing.id;
      } else {
        const { data: newPersona, error } = await supabaseAdmin.auth.admin.createUser({
          email: persona.email,
          password: "TestUser2025!!",
          email_confirm: true,
          user_metadata: { full_name: persona.name },
        });
        if (error) {
          createdPersonas.push({ ...persona, status: "error", message: error.message });
          continue;
        }
        personaId = newPersona.user.id;
      }

      await supabaseAdmin.from("profiles").upsert({
        id: personaId,
        full_name: persona.name,
        email: persona.email,
      }, { onConflict: "id" });

      await supabaseAdmin.from("user_roles").upsert(
        { user_id: personaId, role: persona.role },
        { onConflict: "user_id,role" }
      );

      createdPersonas.push({ ...persona, id: personaId, status: "ok" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        adminUserId: userId,
        roles: ["admin", "estimator"],
        adminRoleError: adminRoleError?.message,
        estimatorRoleError: estimatorRoleError?.message,
        testPersonas: createdPersonas,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

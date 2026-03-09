import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_ACCOUNTS = [
  {
    email: "test-estimator@smartreno.io",
    password: "Smart2025!!",
    fullName: "Test Estimator",
    role: "estimator",
    extra: async (supabase: any, userId: string) => {
      const { data } = await supabase.from("estimators").select("id").eq("user_id", userId).maybeSingle();
      if (!data) {
        await supabase.from("estimators").insert({
          user_id: userId,
          display_name: "Test Estimator",
          is_active: true,
          service_zip_codes: ["07452", "07450", "07446"],
          specializations: ["kitchen", "bathroom", "basement"],
          max_assignments: 10,
          current_assignments: 0,
        });
      }
    },
  },
  {
    email: "test-contractor@smartreno.io",
    password: "Smart2025!!",
    fullName: "Test Contractor",
    role: "contractor",
    extra: async (supabase: any, userId: string) => {
      const { data } = await supabase.from("contractors").select("id").eq("user_id", userId).maybeSingle();
      if (!data) {
        await supabase.from("contractors").insert({
          user_id: userId,
          company_name: "Test Contractor LLC",
          contact_name: "Test Contractor",
          email: "test-contractor@smartreno.io",
          phone: "201-555-0100",
          status: "active",
        });
      }
    },
  },
  {
    email: "test-homeowner@smartreno.io",
    password: "Smart2025!!",
    fullName: "Test Homeowner",
    role: "homeowner",
    extra: null,
  },
  {
    email: "test-designpro@smartreno.io",
    password: "Smart2025!!",
    fullName: "Test Design Professional",
    role: "design_professional",
    extra: null,
  },
];

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

    const results: any[] = [];

    for (const account of TEST_ACCOUNTS) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === account.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
      } else {
        const { data: newUser, error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: { full_name: account.fullName },
        });
        if (error) throw error;
        userId = newUser.user.id;
      }

      // Upsert profile
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: account.fullName,
        email: account.email,
        profile_completed: true,
      }, { onConflict: "id" });

      // Ensure role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", account.role)
        .maybeSingle();

      if (!existingRole) {
        await supabase.from("user_roles").insert({ user_id: userId, role: account.role });
      }

      // Run extra setup
      if (account.extra) {
        await account.extra(supabase, userId);
      }

      results.push({
        email: account.email,
        password: account.password,
        role: account.role,
        userId,
        existed: !!existing,
      });
    }

    return new Response(
      JSON.stringify({ success: true, accounts: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error seeding test accounts:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

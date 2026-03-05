import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  applicantId: string;
  applicantType: 'homeowner' | 'contractor' | 'architect' | 'estimator' | 'subcontractor' | 'vendor' | 'partner' | 'admin';
  action: 'approve' | 'reject';
  rejectionReason?: string;
  assignedRole?: string; // For admin approvals
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      throw new Error("Only admins can approve accounts");
    }

    const { applicantId, applicantType, action, rejectionReason, assignedRole }: ApprovalRequest = await req.json();

    // Map applicant type to table
    const tableMap: Record<string, { table: string; userIdField: string }> = {
      homeowner: { table: "homeowner_applicants", userIdField: "user_id" },
      contractor: { table: "contractor_applications", userIdField: "user_id" },
      architect: { table: "interior_designer_applications", userIdField: "user_id" },
      estimator: { table: "estimator_applicants", userIdField: "user_id" },
      subcontractor: { table: "subcontractor_applicants", userIdField: "user_id" },
      vendor: { table: "vendor_applicants", userIdField: "user_id" },
      partner: { table: "partner_applicants", userIdField: "user_id" },
      admin: { table: "contractor_applications", userIdField: "user_id" }, // Reusing for admin team
    };

    const { table, userIdField } = tableMap[applicantType];

    // Get applicant details
    const { data: applicant, error: applicantError } = await supabase
      .from(table)
      .select("*")
      .eq("id", applicantId)
      .single();

    if (applicantError || !applicant) {
      throw new Error("Applicant not found");
    }

    // Update applicant status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(updateData)
      .eq("id", applicantId);

    if (updateError) throw updateError;

    // If approved, assign role
    if (action === 'approve') {
      const roleMap: Record<string, string> = {
        homeowner: 'homeowner',
        contractor: 'contractor',
        architect: 'architect',
        estimator: 'estimator',
        subcontractor: 'subcontractor',
        vendor: 'vendor',
        partner: 'partner',
        admin: assignedRole || 'admin', // Use provided role or default to admin
      };

      const roleToAssign = roleMap[applicantType];

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", applicant[userIdField])
        .eq("role", roleToAssign)
        .single();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: applicant[userIdField],
            role: roleToAssign,
          });

        if (roleError) throw roleError;
      }

      // Log AI agent activity
      await supabase.from("ai_agent_activity").insert({
        user_id: user.id,
        agent_type: "account_approval",
        user_role: "admin",
        input: { applicantId, applicantType, action },
        output: { success: true, roleAssigned: roleToAssign },
        status: "completed",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Account ${action}d successfully`,
        applicantType,
        action,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in approve-account:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

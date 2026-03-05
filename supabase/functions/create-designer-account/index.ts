import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const CreateDesignerAccountSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  name: z.string().trim().min(2, "Name too short").max(100, "Name too long"),
  applicationId: z.string().uuid("Invalid application ID"),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input
    const validationResult = CreateDesignerAccountSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { email, name, applicationId } = validationResult.data;

    console.log("Creating designer account for:", email);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate a random temporary password
    const tempPassword = crypto.randomUUID();

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: name,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    if (!newUser.user) {
      throw new Error("User creation failed - no user returned");
    }

    console.log("User created successfully:", newUser.user.id);

    // Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        full_name: name,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Don't throw - profile might already exist from trigger
    }

    // Assign interior_designer role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "interior_designer",
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      throw new Error(`Failed to assign interior_designer role: ${roleError.message}`);
    }

    console.log("Role assigned successfully");

    // Generate password reset link for initial login
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const redirectUrl = supabaseUrl ? `${supabaseUrl.replace("https://", "https://app.")}/interiordesigner/dashboard` : "";
    
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (resetError) {
      console.error("Error generating magic link:", resetError);
      throw resetError;
    }

    console.log("Magic link generated successfully");

    // Send welcome email with login link via the notification function
    try {
      const { error: emailError } = await supabaseAdmin.functions.invoke(
        "send-designer-welcome-email",
        {
          body: {
            email,
            name,
            magicLink: resetData.properties.action_link,
          },
        }
      );

      if (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't throw - account is created, email is secondary
      }
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
      // Don't throw - account is created
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        message: "Designer account created successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-designer-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

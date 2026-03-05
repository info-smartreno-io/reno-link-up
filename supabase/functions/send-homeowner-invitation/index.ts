import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  homeowner_id: string;
  project_id: string;
  project_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { homeowner_id, project_id, project_name }: InvitationRequest = await req.json();

    // Create Supabase client with service role key to access user data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get homeowner profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", homeowner_id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("contractor_projects")
      .select("project_name, location")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError) {
      console.error("Error fetching project:", projectError);
    }

    // Get user email (requires service role)
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(homeowner_id);

    if (userError || !user?.email) {
      throw new Error("Could not find homeowner email");
    }

    const homeowner_name = profile?.full_name || user.email.split("@")[0];
    const portalUrl = `https://${req.headers.get("host")}/homeowner-portal`;

    // Create HTML email content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background-color: #0B6EF3; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to SmartReno! 🏠</h1>
            </div>
            
            <div style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
                Hi ${homeowner_name},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
                Great news! You've been added to your renovation project on SmartReno. 
                You now have access to view all project details, timelines, and updates.
              </p>

              <div style="background-color: #f0f7ff; border-left: 4px solid #0B6EF3; border-radius: 8px; padding: 24px; margin: 32px 0;">
                <p style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                  YOUR PROJECT:
                </p>
                <h2 style="color: #0B6EF3; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
                  ${project?.project_name || project_name}
                </h2>
                <p style="color: #666; font-size: 14px; margin: 0;">
                  ${project?.location || ""}
                </p>
              </div>

              <p style="color: #333; font-size: 16px; line-height: 24px; margin-bottom: 12px;">
                With your SmartReno homeowner portal, you can:
              </p>

              <ul style="color: #333; font-size: 16px; line-height: 24px; margin-bottom: 32px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">View real-time project progress and timelines</li>
                <li style="margin-bottom: 8px;">Track milestones and upcoming tasks</li>
                <li style="margin-bottom: 8px;">Communicate with your contractor</li>
                <li style="margin-bottom: 8px;">Access project documents and photos</li>
              </ul>

              <a href="${portalUrl}" style="display: block; background-color: #0B6EF3; color: #ffffff; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 32px 0;">
                View Your Project
              </a>

              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 32px 0;">

              <p style="color: #8898aa; font-size: 14px; line-height: 22px; margin-top: 12px;">
                If you have any questions, please don't hesitate to reach out to your project team.
              </p>

              <p style="color: #8898aa; font-size: 14px; line-height: 22px; margin-top: 12px;">
                <strong>SmartReno</strong><br>
                Renovations, Simplified.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email
    const { data, error } = await resend.emails.send({
      from: "SmartReno <hello@smartreno.io>",
      to: [user.email],
      subject: `You've been added to ${project?.project_name || project_name}`,
      html,
    });

    if (error) {
      throw error;
    }

    console.log("Invitation email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-homeowner-invitation function:", error);
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

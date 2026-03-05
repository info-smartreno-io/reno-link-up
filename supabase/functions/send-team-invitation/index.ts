import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitationId: string;
  email: string;
  role: string;
  invitedByName: string;
  companyName?: string;
  invitationToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      role,
      invitedByName,
      companyName,
      invitationToken,
    }: InvitationRequest = await req.json();

    console.log("Sending team invitation email to:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const invitationLink = `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/invite/accept?token=${invitationToken}`;

    const roleName = role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const companyText = companyName ? ` at ${companyName}` : "";

    const emailResponse = await resend.emails.send({
      from: "SmartReno <hello@smartreno.io>",
      to: [email],
      subject: `You've been invited to join${companyText}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Team Invitation</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hi there! 👋
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                <strong>${invitedByName}</strong> has invited you to join their team${companyText} as a <strong>${roleName}</strong>.
              </p>
              
              <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong>Role:</strong> ${roleName}
                </p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Click the button below to accept the invitation and set up your account:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 25px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; color: #667eea; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
                ${invitationLink}
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 13px; color: #9ca3af; margin: 0;">
                  This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>SmartReno - Renovation Project Management Platform</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  magicLink: string;
}

const getWelcomeHTML = (name: string, magicLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="padding: 40px 48px;">
      <h1 style="color: #333; font-size: 28px; font-weight: bold; margin: 0 0 24px 0; text-align: center;">🎉 Welcome to SmartReno!</h1>
      
      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        Hi ${name},
      </p>

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        Congratulations! Your interior designer application has been approved and your account is now active.
      </p>

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
        We've created your account and you can now access the SmartReno platform to view projects and submit bids.
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 32px 0;">
        <h2 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 16px 0;">Get Started</h2>
        
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ Click the button below to set up your password and access your dashboard</p>
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ Complete your profile with additional portfolio items</p>
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ Browse available projects in the bid room</p>
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ Submit your first proposal</p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLink}" style="display: inline-block; background-color: #2563eb; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">Access Your Account</a>
      </div>

      <p style="color: #666; font-size: 14px; line-height: 22px; margin: 24px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <strong>Security Note:</strong> This link will expire in 24 hours. After your first login, you can set up your own password for future access.
      </p>

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        If you have any questions or need assistance, please reach out to our support team at support@smartreno.io.
      </p>

      <p style="color: #8898aa; font-size: 14px; line-height: 22px; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e6ebf1;">
        Welcome to the SmartReno family!<br />
        The SmartReno Team
      </p>

      <p style="color: #8898aa; font-size: 12px; line-height: 18px; margin-top: 24px;">
        If the button above doesn't work, copy and paste this link into your browser:<br />
        <a href="${magicLink}" style="color: #2563eb; word-break: break-all;">${magicLink}</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, magicLink }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    const html = getWelcomeHTML(name, magicLink);

    const emailResponse = await resend.emails.send({
      from: "SmartReno <hello@smartreno.io>",
      to: [email],
      subject: "Welcome to SmartReno - Your Account is Ready!",
      html,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-designer-welcome-email function:", error);
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

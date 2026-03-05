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
  source?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Welcome email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, source = "blog" }: WelcomeEmailRequest = await req.json();
    console.log(`Sending welcome email to: ${email} (source: ${source})`);

    const emailResponse = await resend.emails.send({
      from: "SmartReno <hello@smartreno.io>",
      to: [email],
      subject: "Welcome to SmartReno Newsletter! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
              .content p { margin: 16px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .button:hover { background: #5568d3; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .footer a { color: #667eea; text-decoration: none; }
              .divider { height: 1px; background: #e5e7eb; margin: 30px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to SmartReno! 🏡</h1>
              </div>
              <div class="content">
                <p><strong>Hi there,</strong></p>
                
                <p>Thank you for subscribing to the SmartReno newsletter! We're excited to have you join our community of homeowners and renovation enthusiasts across North Jersey.</p>
                
                <p>Here's what you can expect from us:</p>
                
                <ul style="margin: 20px 0; padding-left: 20px;">
                  <li><strong>Expert Renovation Guides</strong> - Step-by-step advice for your home projects</li>
                  <li><strong>Local Market Insights</strong> - Trends and tips specific to North Jersey</li>
                  <li><strong>Budget & Planning Tools</strong> - Help you make informed decisions</li>
                  <li><strong>Contractor Tips</strong> - Find and work with the right professionals</li>
                  <li><strong>Design Inspiration</strong> - Beautiful ideas for your home transformation</li>
                </ul>
                
                <div class="divider"></div>
                
                <p>Ready to start your renovation journey?</p>
                
                <center>
                  <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("https://", "https://").replace(".supabase.co", "") || "https://smartreno.com"}/blog" class="button">Explore Our Blog</a>
                </center>
                
                <div class="divider"></div>
                
                <p style="font-size: 14px; color: #6b7280;">
                  Questions? Just reply to this email - we'd love to hear from you!
                </p>
              </div>
              <div class="footer">
                <p>SmartReno - Your Partner in Home Renovation</p>
                <p>
                  <a href="#">Unsubscribe</a> | <a href="#">Manage Preferences</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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

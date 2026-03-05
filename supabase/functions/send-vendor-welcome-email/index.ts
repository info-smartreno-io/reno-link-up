import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  companyName: string;
  userId: string;
}

const getWelcomeHTML = (companyName: string, magicLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SmartReno Contractor Network</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SmartReno!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Congratulations, ${companyName}!</h2>
    
    <p style="font-size: 16px; color: #4b5563;">
      Your vendor application has been <strong style="color: #10b981;">approved</strong>! Welcome to the SmartReno contractor network.
    </p>
    
    <p style="font-size: 16px; color: #4b5563;">
      We're excited to have you join our platform where you can connect with homeowners and grow your business.
    </p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Get Started</h3>
      <p style="color: #4b5563; margin-bottom: 20px;">
        Click the button below to access your contractor dashboard and start bidding on projects:
      </p>
      <a href="${magicLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Access Your Dashboard
      </a>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px; margin-bottom: 0;">
        This link will expire in 24 hours. For future logins, you can use the magic link feature on our login page.
      </p>
    </div>
    
    <h3 style="color: #1f2937; font-size: 18px;">What's Next?</h3>
    <ul style="color: #4b5563; padding-left: 20px;">
      <li style="margin-bottom: 10px;">Complete your contractor profile</li>
      <li style="margin-bottom: 10px;">Browse available bid opportunities</li>
      <li style="margin-bottom: 10px;">Submit competitive bids on projects</li>
      <li style="margin-bottom: 10px;">Manage your projects and communication with homeowners</li>
    </ul>
    
    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
        Need help getting started?
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 0;">
        Contact our support team at <a href="mailto:support@smartreno.com" style="color: #667eea;">support@smartreno.com</a>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
    <p>SmartReno - Simplifying Home Renovations</p>
  </div>
</body>
</html>
`;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName, userId }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', email);

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate magic link for contractor dashboard
    const redirectTo = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/contractor/dashboard`;
    
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError);
      throw magicLinkError;
    }

    const magicLink = magicLinkData.properties.action_link;
    console.log('Generated magic link for vendor');

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: 'SmartReno <hello@smartreno.io>',
      to: [email],
      subject: `Welcome to SmartReno Contractor Network, ${companyName}!`,
      html: getWelcomeHTML(companyName, magicLink),
    });

    console.log('Welcome email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in send-vendor-welcome-email function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send welcome email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

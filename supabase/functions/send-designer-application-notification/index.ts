import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_application" | "application_approved" | "application_rejected";
  designerName?: string;
  designerEmail?: string;
  applicationData?: {
    yearsExperience: number;
    specializations: string[];
    serviceAreas: string[];
    portfolioUrl?: string;
  };
  adminNotes?: string;
  // Additional fields for vendor applications
  name?: string;
  email?: string;
  companyName?: string;
  applicationType?: 'interior_designer' | 'vendor';
}

const ADMIN_EMAIL = "admin@smartreno.io";

const getAdminNotificationHTML = (data: {
  name: string;
  email: string;
  yearsExperience?: number;
  specializations?: string[];
  serviceAreas?: string[];
  portfolioUrl?: string;
  companyName?: string;
  applicationType: string;
}) => {
  const appType = data.applicationType === 'vendor' ? 'Vendor' : 'Interior Designer';
  const displayName = data.companyName || data.name;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="padding: 40px 48px;">
      <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 0 0 24px 0;">New ${appType} Application</h1>
      
      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
        A new ${appType.toLowerCase()} has applied to join the SmartReno network.
      </p>

      <div style="background-color: #f8fafc; border-radius: 6px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #333; font-size: 18px; font-weight: bold; margin: 0 0 16px 0;">Applicant Information</h2>
        
        <p style="color: #333; font-size: 14px; line-height: 24px; margin: 8px 0;"><strong>Name:</strong> ${data.name}</p>
        ${data.companyName ? `<p style="color: #333; font-size: 14px; line-height: 24px; margin: 8px 0;"><strong>Company:</strong> ${data.companyName}</p>` : ''}
        <p style="color: #333; font-size: 14px; line-height: 24px; margin: 8px 0;"><strong>Email:</strong> ${data.email}</p>
        ${data.yearsExperience ? `<p style="color: #333; font-size: 14px; line-height: 24px; margin: 8px 0;"><strong>Years of Experience:</strong> ${data.yearsExperience}</p>` : ''}
        ${data.portfolioUrl ? `<p style="color: #333; font-size: 14px; line-height: 24px; margin: 8px 0;"><strong>Portfolio:</strong> <a href="${data.portfolioUrl}" style="color: #2563eb;">View Portfolio</a></p>` : ''}
        ${data.specializations ? `<p style="color: #333; font-size: 14px; line-height: 24px; margin: 8px 0;"><strong>Specializations:</strong> ${data.specializations.join(", ")}</p>` : ''}
        ${data.serviceAreas ? `<p style="color: #333; font-size: 14px; line-height: 24px; margin: 8px 0;"><strong>Service Areas:</strong> ${data.serviceAreas.join(", ")}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://your-domain.com/admin/${data.applicationType === 'vendor' ? 'vendors' : 'interior-designer-applications'}" style="display: inline-block; background-color: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold;">Review Application</a>
      </div>

      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin-top: 32px;">
        This is an automated notification from SmartReno.
      </p>
    </div>
  </div>
</body>
</html>
`;
};

const getApprovalHTML = (name: string, companyName?: string) => {
  const displayName = companyName || name;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="padding: 40px 48px;">
      <h1 style="color: #333; font-size: 28px; font-weight: bold; margin: 0 0 24px 0; text-align: center;">🎉 Congratulations, ${displayName}!</h1>
      
      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        We're excited to let you know that your application to join the SmartReno network has been <strong>approved</strong>!
      </p>

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
        You now have access to our exclusive bid room where you can view and submit proposals for curated residential projects that match your expertise.
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 32px 0;">
        <h2 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 16px 0;">What's Next?</h2>
        
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ <strong>Access the Bid Room:</strong> Browse available projects and submit your proposals</p>
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ <strong>Complete Your Profile:</strong> Add more portfolio items and showcase your best work</p>
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ <strong>Start Bidding:</strong> Submit detailed design proposals with timelines and pricing</p>
        <p style="color: #333; font-size: 15px; line-height: 28px; margin: 8px 0;">✓ <strong>Collaborate:</strong> Work directly with homeowners and contractors through our platform</p>
      </div>

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        You'll receive a separate email with login instructions to access your dashboard.
      </p>

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team at support@smartreno.io.
      </p>

      <p style="color: #8898aa; font-size: 14px; line-height: 22px; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e6ebf1;">
        Welcome to the SmartReno family!<br />
        The SmartReno Team
      </p>
    </div>
  </div>
</body>
</html>
`;
};

const getRejectionHTML = (name: string, companyName?: string, adminNotes?: string) => {
  const displayName = companyName || name;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="padding: 40px 48px;">
      <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 0 0 24px 0;">Thank You for Your Interest, ${displayName}</h1>
      
      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        Thank you for taking the time to apply to join the SmartReno network. We appreciate your interest in partnering with us.
      </p>

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
        After careful review of your application, we regret to inform you that we are unable to accept your application at this time.
      </p>

      ${adminNotes ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 24px; margin: 24px 0;">
        <h2 style="color: #333; font-size: 18px; font-weight: bold; margin: 0 0 16px 0;">Additional Information</h2>
        <p style="color: #333; font-size: 15px; line-height: 24px; margin: 0;">${adminNotes}</p>
      </div>
      ` : ''}

      <p style="color: #333; font-size: 16px; line-height: 26px; margin-bottom: 16px;">
        We encourage you to continue building your portfolio and gaining experience. You're welcome to reapply in the future as your business grows.
      </p>

      <p style="color: #8898aa; font-size: 14px; line-height: 22px; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e6ebf1;">
        Best regards,<br />
        The SmartReno Team
      </p>
    </div>
  </div>
</body>
</html>
`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: NotificationRequest = await req.json();

    console.log("Processing notification:", { type: request.type });

    // Support both old and new field names
    const name = request.name || request.designerName || '';
    const email = request.email || request.designerEmail || '';
    const applicationType = request.applicationType || 'interior_designer';

    let emailResponse;

    switch (request.type) {
      case "new_application": {
        if (!request.applicationData && applicationType === 'interior_designer') {
          throw new Error("Application data is required for interior designer notifications");
        }

        const html = getAdminNotificationHTML({
          name,
          email,
          yearsExperience: request.applicationData?.yearsExperience,
          specializations: request.applicationData?.specializations,
          serviceAreas: request.applicationData?.serviceAreas,
          portfolioUrl: request.applicationData?.portfolioUrl,
          companyName: request.companyName,
          applicationType,
        });

        const appType = applicationType === 'vendor' ? 'Vendor' : 'Interior Designer';
        const displayName = request.companyName || name;

        emailResponse = await resend.emails.send({
          from: "SmartReno <notifications@smartreno.io>",
          to: [ADMIN_EMAIL],
          subject: `New ${appType} Application: ${displayName}`,
          html,
        });
        break;
      }

      case "application_approved": {
        const html = getApprovalHTML(name, request.companyName);

        emailResponse = await resend.emails.send({
          from: "SmartReno <hello@smartreno.io>",
          to: [email],
          subject: "Welcome to SmartReno - Application Approved!",
          html,
        });
        break;
      }

      case "application_rejected": {
        const html = getRejectionHTML(name, request.companyName, request.adminNotes);

        emailResponse = await resend.emails.send({
          from: "SmartReno <notifications@smartreno.io>",
          to: [email],
          subject: "SmartReno Application Status Update",
          html,
        });
        break;
      }

      default:
        throw new Error(`Unknown notification type: ${request.type}`);
    }

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-designer-application-notification function:", error);
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

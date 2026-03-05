import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  trackingNumber: string;
  productCategories: string;
  serviceAreas: string;
  hasLicense: boolean;
  hasInsurance: boolean;
  portfolioCount: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AdminNotificationRequest = await req.json();

    console.log("Sending admin notification for application:", body.trackingNumber);

    // Get current date formatted
    const submittedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Simplified HTML email template instead of React Email
    const html = `
      <h2>New Contractor Application Received</h2>
      <p><strong>Tracking Number:</strong> ${body.trackingNumber}</p>
      <p><strong>Company Name:</strong> ${body.companyName}</p>
      <p><strong>Contact Name:</strong> ${body.contactName}</p>
      <p><strong>Email:</strong> ${body.email}</p>
      <p><strong>Phone:</strong> ${body.phone}</p>
      <p><strong>Product Categories:</strong> ${body.productCategories}</p>
      <p><strong>Service Areas:</strong> ${body.serviceAreas}</p>
      <p><strong>Has License:</strong> ${body.hasLicense ? 'Yes' : 'No'}</p>
      <p><strong>Has Insurance:</strong> ${body.hasInsurance ? 'Yes' : 'No'}</p>
      <p><strong>Portfolio Count:</strong> ${body.portfolioCount}</p>
      <p><strong>Submitted:</strong> ${submittedDate}</p>
    `;

    // Send the email using Resend to admin email
    const { data, error } = await resend.emails.send({
      from: "SmartReno Applications <notifications@smartreno.io>",
      to: ["info@smartreno.io"],
      subject: `New Contractor Application - ${body.companyName} (${body.trackingNumber})`,
      html,
      replyTo: body.email,
    });

    if (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }

    console.log("Admin notification sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-contractor-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send admin notification",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);

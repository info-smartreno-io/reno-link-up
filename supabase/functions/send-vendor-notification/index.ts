import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VendorNotificationRequest {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  product_categories: string;
  service_areas?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vendorData: VendorNotificationRequest = await req.json();

    console.log("Processing vendor application notification:", {
      company: vendorData.company_name,
      email: vendorData.email,
    });

    // Send notification to SmartReno team
    const emailResponse = await resend.emails.send({
      from: "SmartReno Notifications <notifications@smartreno.io>",
      to: ["admin@smartreno.com"], // Replace with actual SmartReno team email
      subject: `New Vendor Application: ${vendorData.company_name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
              .field { margin-bottom: 15px; }
              .field-label { font-weight: bold; color: #555; }
              .field-value { margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #667eea; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🏢 New Vendor Application</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">A new vendor partnership application has been submitted</p>
              </div>
              
              <div class="content">
                <div class="field">
                  <div class="field-label">Company Name</div>
                  <div class="field-value">${vendorData.company_name}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Contact Person</div>
                  <div class="field-value">${vendorData.contact_name}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">Email</div>
                  <div class="field-value"><a href="mailto:${vendorData.email}">${vendorData.email}</a></div>
                </div>
                
                <div class="field">
                  <div class="field-label">Phone</div>
                  <div class="field-value"><a href="tel:${vendorData.phone}">${vendorData.phone}</a></div>
                </div>
                
                <div class="field">
                  <div class="field-label">Product Categories</div>
                  <div class="field-value">${vendorData.product_categories}</div>
                </div>
                
                ${vendorData.service_areas ? `
                <div class="field">
                  <div class="field-label">Service Areas</div>
                  <div class="field-value">${vendorData.service_areas}</div>
                </div>
                ` : ''}
                
                ${vendorData.message ? `
                <div class="field">
                  <div class="field-label">Message</div>
                  <div class="field-value">${vendorData.message}</div>
                </div>
                ` : ''}
                
                <div style="text-align: center;">
                  <a href="https://yoursite.com/admin/vendors" class="button">Review Application in Admin Dashboard</a>
                </div>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from SmartReno.</p>
                <p>Please review this application in the admin dashboard.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Vendor notification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: emailResponse.data?.id 
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
    console.error("Error sending vendor notification email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
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

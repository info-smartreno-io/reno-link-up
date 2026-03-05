import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationRequest {
  name: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  description: string;
  role: string;
  resumeUrl: string;
  portfolioUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      name,
      email,
      phone,
      linkedinUrl,
      description,
      role,
      resumeUrl,
      portfolioUrl,
    }: ApplicationRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Save application to database
    const { data: application, error: dbError } = await supabase
      .from('job_applications')
      .insert({
        role,
        name,
        email,
        phone,
        linkedin_url: linkedinUrl,
        description,
        resume_url: resumeUrl,
        portfolio_url: portfolioUrl,
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save application");
    }

    console.log("Application saved to database:", application.id);

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailHtml = `
      <h2>New Job Application — ${role}</h2>
      
      <h3>Applicant Information</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      ${linkedinUrl ? `<p><strong>LinkedIn:</strong> <a href="${linkedinUrl}">${linkedinUrl}</a></p>` : ""}
      
      <h3>How can they add value from day 1?</h3>
      <p style="white-space: pre-wrap;">${description}</p>
      
      <h3>Attachments</h3>
      <p><strong>Resume:</strong> <a href="${resumeUrl}">View Resume</a></p>
      ${portfolioUrl ? `<p><strong>Portfolio:</strong> <a href="${portfolioUrl}">View Portfolio</a></p>` : ""}
      
      <hr style="margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">
        This application was submitted via SmartReno Careers at ${new Date().toLocaleString()}
      </p>
    `;

    // Send application email to SmartReno
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SmartReno Careers <careers@smartreno.io>",
        to: ["info@smartreno.io"],
        reply_to: email,
        subject: `[Application] ${role} — ${name}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error("Resend API error:", error);
      throw new Error("Failed to send application email");
    }

    const data = await resendResponse.json();
    console.log("Application email sent successfully:", data);

    // Send confirmation email to applicant
    const confirmationHtml = `
      <h1>Thank You for Your Application!</h1>
      
      <p>Hi ${name},</p>
      
      <p>We've received your application for the <strong>${role}</strong> position at SmartReno. Thank you for your interest in joining our team!</p>
      
      <h2>What's Next?</h2>
      <ul>
        <li><strong>Application Review:</strong> Our hiring team will review your application within 3-5 business days</li>
        <li><strong>Initial Screening:</strong> If your qualifications match our needs, we'll reach out to schedule a phone interview</li>
        <li><strong>Interview Process:</strong> Selected candidates will go through 2-3 rounds of interviews with our team</li>
        <li><strong>Decision:</strong> We aim to complete the entire process within 2-3 weeks</li>
      </ul>
      
      <p>We appreciate the time you've taken to apply and look forward to learning more about how you can add value to SmartReno from day 1.</p>
      
      <p>If you have any questions in the meantime, feel free to reply to this email.</p>
      
      <p>Best regards,<br>
      <strong>The SmartReno Team</strong><br>
      <a href="https://smartreno.io">smartreno.io</a></p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated confirmation email. Please do not reply directly to this message.
      </p>
    `;

    const confirmationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SmartReno Careers <careers@smartreno.io>",
        to: [email],
        subject: `Application Received — ${role} at SmartReno`,
        html: confirmationHtml,
      }),
    });

    if (!confirmationResponse.ok) {
      const error = await confirmationResponse.text();
      console.error("Confirmation email error:", error);
      // Don't throw error here - application was already sent
      console.log("Application sent but confirmation email failed");
    } else {
      const confirmationData = await confirmationResponse.json();
      console.log("Confirmation email sent successfully:", confirmationData);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-application function:", error);
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

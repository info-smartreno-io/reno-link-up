import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmsInvitationRequest {
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  invitationLink: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const { 
      phone, 
      firstName, 
      lastName, 
      role, 
      invitationLink,
      companyName = "SmartReno"
    }: SmsInvitationRequest = await req.json();

    console.log(`Sending team invitation SMS to ${phone} for ${firstName} ${lastName}`);

    const roleDisplay = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const message = `Hi ${firstName}! You've been invited to join ${companyName} as a ${roleDisplay}. Accept your invitation here: ${invitationLink}`;

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const authHeader = `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`;

    const body = new URLSearchParams({
      To: phone,
      From: twilioPhoneNumber,
      Body: message,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Twilio API error:", errorData);
      throw new Error(`Twilio API error: ${response.status} - ${errorData}`);
    }

    const smsResponse = await response.json();
    console.log("Invitation SMS sent successfully:", smsResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: smsResponse.sid 
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
    console.error("Error sending team invitation SMS:", error);
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

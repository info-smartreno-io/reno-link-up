import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PermitSMSRequest {
  phoneNumber: string;
  permitStatus: string;
  municipality: string;
  permitNumber?: string;
  homeownerName?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      phoneNumber, 
      permitStatus, 
      municipality, 
      permitNumber,
      homeownerName,
      isOverdue,
      daysOverdue
    }: PermitSMSRequest = await req.json();

    console.log("Sending permit SMS to:", phoneNumber, "Status:", permitStatus);

    // Format phone number to E.164 format if not already
    let formattedPhone = phoneNumber.replace(/\D/g, "");
    if (!formattedPhone.startsWith("1") && formattedPhone.length === 10) {
      formattedPhone = "1" + formattedPhone;
    }
    formattedPhone = "+" + formattedPhone;

    // Generate SMS message based on status
    let message = "";
    
    if (isOverdue) {
      message = `⚠️ SmartReno Alert: Your permit for ${municipality} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. We're following up with the municipality. ${permitNumber ? `Permit #${permitNumber}` : ''}`;
    } else {
      switch (permitStatus) {
        case "approved":
          message = `🎉 Great news${homeownerName ? ` ${homeownerName}` : ''}! Your building permit has been APPROVED by ${municipality}. ${permitNumber ? `Permit #${permitNumber}. ` : ''}You can now begin work!`;
          break;
        case "revisions_required":
          message = `⚠️ SmartReno: Your permit application for ${municipality} requires revisions. Our team is addressing this and will resubmit shortly. ${permitNumber ? `Ref: ${permitNumber}` : ''}`;
          break;
        case "zoning_pending":
          message = `📋 SmartReno Update: Your project is under zoning review by ${municipality}. This is a standard step before permit approval. ${permitNumber ? `Ref: ${permitNumber}` : ''}`;
          break;
        default:
          message = `SmartReno: Your permit status for ${municipality} has been updated to ${permitStatus.replace(/_/g, ' ')}. ${permitNumber ? `Ref: ${permitNumber}` : ''}`;
      }
    }

    // Twilio API credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("From", fromNumber);
    formData.append("Body", message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", result);
      throw new Error(`Twilio error: ${result.message || 'Unknown error'}`);
    }

    console.log("SMS sent successfully:", result.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in send-permit-sms:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);

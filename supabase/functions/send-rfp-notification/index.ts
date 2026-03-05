import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RFPNotificationRequest {
  bidOpportunityId: string;
  opportunityTitle: string;
  projectType: string;
  location: string;
  estimatedBudget: number | null;
  bidDeadline: string;
  description: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      bidOpportunityId,
      opportunityTitle,
      projectType,
      location,
      estimatedBudget,
      bidDeadline,
      description,
    }: RFPNotificationRequest = await req.json();

    console.log("Sending RFP notification for:", opportunityTitle);

    // Get the bid opportunity details
    const { data: opportunity, error: oppError } = await supabase
      .from('bid_opportunities')
      .select('*')
      .eq('id', bidOpportunityId)
      .single();

    if (oppError) {
      console.error('Error fetching opportunity:', oppError);
      throw oppError;
    }

    // Get all contractors who should be notified
    const { data: contractors, error: contractorsError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'contractor');

    if (contractorsError) {
      console.error('Error fetching contractors:', contractorsError);
      throw contractorsError;
    }

    if (!contractors || contractors.length === 0) {
      console.log('No contractors found to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No contractors to notify' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get contractor profiles and emails
    const contractorIds = contractors.map(c => c.user_id);
    
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const contractorUsers = users?.filter(u => contractorIds.includes(u.id)) || [];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', contractorIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Prepare email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Bid Opportunity Available</h1>
        <p>A new project opportunity is now available for bidding on SmartReno.</p>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h2 style="margin-top: 0; color: #1e40af;">${opportunityTitle}</h2>
          <p style="margin: 8px 0;"><strong>Type:</strong> ${projectType}</p>
          <p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>
          ${estimatedBudget ? `<p style="margin: 8px 0;"><strong>Budget:</strong> $${estimatedBudget.toLocaleString()}</p>` : ''}
          <p style="margin: 8px 0;"><strong>Bid Deadline:</strong> ${new Date(bidDeadline).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        ${description ? `
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Project Description:</h3>
            <p style="margin-bottom: 0; color: #4b5563;">${description}</p>
          </div>
        ` : ''}
        
        <div style="margin: 30px 0;">
          <a href="https://pscsnsgvfjcbldomnstb.supabase.co/contractor/bid-room" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Opportunity & Submit Bid
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          This is an automated notification from SmartReno. Don't miss this opportunity to grow your business!
        </p>
      </div>
    `;

    // Send emails and create notifications
    const emailPromises = contractorUsers.map(async (user) => {
      const profile = profiles?.find(p => p.id === user.id);
      const contractorName = profile?.full_name || 'Contractor';

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'New Bid Opportunity',
        message: `${opportunityTitle} - Bid by ${new Date(bidDeadline).toLocaleDateString()}`,
        type: 'new_bid_opportunity',
        link: `/contractor/bid-room`
      });

      // Send email
      return resend.emails.send({
        from: "SmartReno <notifications@smartreno.io>",
        to: [user.email!],
        subject: `New Bid Opportunity: ${opportunityTitle}`,
        html: emailHtml,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log(`RFP notifications sent: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: successCount,
        failed: failureCount 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-rfp-notification function:", error);
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

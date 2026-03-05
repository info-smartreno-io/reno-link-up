import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PMStageNotification {
  projectId: string;
  newStage: string;
  oldStage: string;
  homeownerName: string;
  projectType: string;
  address: string;
  projectManagerEmail?: string;
  projectManagerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      projectId,
      newStage,
      oldStage,
      homeownerName,
      projectType,
      address,
      projectManagerEmail,
      projectManagerName,
    }: PMStageNotification = await req.json();

    console.log("PM stage change notification:", { projectId, oldStage, newStage });

    const stageDisplayName = newStage
      .replace(/^pm_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    let subject = "";
    let htmlContent = "";

    // Determine email content based on new stage
    switch (newStage) {
      case "pm_pre_construction":
        subject = `Project Assigned: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>New Project Assignment</h2>
          <p>A project has been assigned and is ready for pre-construction activities.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Next Steps:</strong> Review project scope, schedule kickoff meeting, and coordinate permits.</p>
        `;
        break;

      case "pm_scheduled":
        subject = `Project Scheduled: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Project Start Date Scheduled</h2>
          <p>The project has been scheduled and is ready to begin.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Next Steps:</strong> Confirm crew assignments, materials, and equipment for mobilization.</p>
        `;
        break;

      case "pm_mobilization":
        subject = `Mobilization Started: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Project Mobilization Phase</h2>
          <p>The project is now in the mobilization phase.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Next Steps:</strong> Coordinate dumpster delivery, material deliveries, and crew arrival.</p>
        `;
        break;

      case "pm_in_progress":
        subject = `Work In Progress: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Active Construction Phase</h2>
          <p>Construction is now actively underway on this project.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Reminder:</strong> Submit daily logs and update progress regularly.</p>
        `;
        break;

      case "pm_inspection_pending":
        subject = `⏳ Inspection Pending: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Inspection Scheduled</h2>
          <p>This project is awaiting inspection.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Action Required:</strong> Ensure site is ready for inspection and all work is complete.</p>
        `;
        break;

      case "pm_inspection_failed":
        subject = `⚠️ Inspection Failed: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2 style="color: #ef4444;">Inspection Failed - Action Required</h2>
          <p>The inspection did not pass and corrective work is needed.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Immediate Action:</strong> Review inspection notes, schedule corrective work, and reschedule inspection.</p>
        `;
        break;

      case "pm_inspection_passed":
        subject = `✅ Inspection Passed: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2 style="color: #22c55e;">Inspection Passed</h2>
          <p>Great news! The inspection has been approved.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Next Steps:</strong> Proceed to next phase of work or move to completion.</p>
        `;
        break;

      case "pm_change_order_review":
        subject = `📋 Change Order Review: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Change Orders Need Review</h2>
          <p>This project has change orders pending review and approval.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Action Required:</strong> Review change orders with homeowner and obtain approval before proceeding.</p>
        `;
        break;

      case "pm_delayed":
        subject = `🚨 Project Delayed: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2 style="color: #f59e0b;">Project Delayed</h2>
          <p>This project has been marked as delayed.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Action Required:</strong> Document delay reason, communicate with homeowner, and update timeline.</p>
        `;
        break;

      case "pm_punch_list":
        subject = `📝 Punch List Phase: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Final Punch List Items</h2>
          <p>The project has moved to the punch list phase.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Next Steps:</strong> Complete all punch list items and schedule final walkthrough.</p>
        `;
        break;

      case "pm_substantial_completion":
        subject = `🎉 Substantial Completion: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Substantial Completion Achieved</h2>
          <p>The project has reached substantial completion!</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Next Steps:</strong> Finalize any remaining items and prepare for closeout.</p>
        `;
        break;

      case "pm_closed_out":
        subject = `✨ Project Closed Out: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2 style="color: #22c55e;">Project Successfully Closed Out</h2>
          <p>Congratulations! This project has been fully closed out.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Next Steps:</strong> Ensure all documentation is filed and warranty period is tracked.</p>
        `;
        break;

      case "pm_warranty":
        subject = `🛡️ Warranty Period: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Project in Warranty Period</h2>
          <p>This project is now in the warranty tracking phase.</p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Reminder:</strong> Monitor for warranty claims and maintain homeowner communication.</p>
        `;
        break;

      default:
        subject = `Project Stage Updated: ${homeownerName} - ${projectType}`;
        htmlContent = `
          <h2>Project Stage Changed</h2>
          <p>The project stage has been updated to: <strong>${stageDisplayName}</strong></p>
          <p><strong>Homeowner:</strong> ${homeownerName}</p>
          <p><strong>Project Type:</strong> ${projectType}</p>
          <p><strong>Location:</strong> ${address}</p>
        `;
    }

    const recipients = [];
    
    // Send to project manager if assigned
    if (projectManagerEmail) {
      recipients.push(projectManagerEmail);
    }

    // Always send to admin/operations
    recipients.push("operations@smartreno.com");

    const { data, error } = await resend.emails.send({
      from: "SmartReno PM Alerts <notifications@smartreno.io>",
      to: recipients,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              h2 { color: #0066cc; margin-bottom: 16px; }
              p { margin-bottom: 12px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              ${htmlContent}
              <div class="footer">
                <p>This is an automated notification from SmartReno Project Management.</p>
                <p>Previous Stage: ${oldStage.replace(/^pm_/, "").replace(/_/g, " ")}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending PM stage notification email:", error);
      throw error;
    }

    console.log("PM stage notification sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-pm-stage-notification:", error);
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

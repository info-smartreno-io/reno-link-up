import { supabase } from "@/integrations/supabase/client";

/**
 * Log an activity event to the bid_packet_activity_log table.
 */
export async function logBidPacketActivity(params: {
  bidPacketId: string;
  bidSubmissionId?: string | null;
  actorId: string;
  actorRole: string;
  actionType: string;
  actionDetails?: Record<string, any>;
}) {
  try {
    await (supabase as any).from("bid_packet_activity_log").insert({
      bid_packet_id: params.bidPacketId,
      bid_submission_id: params.bidSubmissionId || null,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      action_type: params.actionType,
      action_details: params.actionDetails || {},
    });
  } catch (e) {
    console.error("Failed to log bid packet activity:", e);
  }
}

/**
 * Create an immutable submission snapshot in bid_submission_history.
 */
export async function snapshotBidSubmission(params: {
  submissionId: string;
  bidAmount: number | null;
  estimatedTimeline: string | null;
  proposalText: string | null;
  attachments: any;
  status: string;
  revisionNotes?: string | null;
  createdBy: string;
  sourceEvent: string;
}) {
  try {
    await (supabase as any).from("bid_submission_history").insert({
      bid_submission_id: params.submissionId,
      bid_amount: params.bidAmount,
      estimated_timeline: params.estimatedTimeline,
      proposal_text: params.proposalText,
      attachments: params.attachments,
      status: params.status,
      revision_notes: params.revisionNotes || null,
      created_by: params.createdBy,
      source_event: params.sourceEvent,
    });
  } catch (e) {
    console.error("Failed to snapshot bid submission:", e);
  }
}

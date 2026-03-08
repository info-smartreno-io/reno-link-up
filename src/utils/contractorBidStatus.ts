/**
 * Normalized contractor-facing bid status model.
 * Computes a single display status from invite + submission data.
 */

export type ContractorBidDisplayStatus =
  | "new_invite"
  | "draft_in_progress"
  | "submitted"
  | "revision_requested"
  | "resubmitted"
  | "awarded"
  | "declined"
  | "closed";

export interface ContractorBidStatusInput {
  inviteStatus: string;
  submissionStatus?: string | null;
  submissionRevisionCount?: number;
  deadlinePassed: boolean;
}

export function computeContractorBidStatus(input: ContractorBidStatusInput): ContractorBidDisplayStatus {
  const { inviteStatus, submissionStatus, submissionRevisionCount = 0, deadlinePassed } = input;

  // Declined
  if (inviteStatus === "declined") return "declined";

  // Awarded
  if (submissionStatus === "awarded" || inviteStatus === "awarded") return "awarded";

  // Revision requested
  if (submissionStatus === "revision_requested") return "revision_requested";

  // Resubmitted
  if (submissionStatus === "submitted" && submissionRevisionCount > 0) return "resubmitted";

  // Submitted
  if (submissionStatus === "submitted" || inviteStatus === "submitted") return "submitted";

  // Closed (deadline passed, not submitted)
  if (deadlinePassed) return "closed";

  // Draft in progress
  if (submissionStatus === "draft") return "draft_in_progress";

  // New invite (viewed or invited)
  return "new_invite";
}

export const BID_STATUS_CONFIG: Record<ContractorBidDisplayStatus, {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  color?: string;
}> = {
  new_invite: { label: "New Invite", variant: "secondary" },
  draft_in_progress: { label: "Draft", variant: "outline" },
  submitted: { label: "Submitted", variant: "default" },
  revision_requested: { label: "Revision Requested", variant: "destructive" },
  resubmitted: { label: "Resubmitted", variant: "default" },
  awarded: { label: "Awarded", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
  closed: { label: "Closed", variant: "outline" },
};

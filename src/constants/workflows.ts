/**
 * Centralized workflow status constants
 * Use these throughout the application to prevent typos and ensure consistency
 */

export const WORKFLOW_STATUS = {
  // Lead statuses
  NEW_LEAD: "new_lead",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  LOST: "lost",
  
  // Estimate statuses
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  
  // Walkthrough statuses
  WALKTHROUGH_SCHEDULED: "scheduled",
  WALKTHROUGH_IN_PROGRESS: "in_progress",
  WALKTHROUGH_COMPLETED: "completed",
  WALKTHROUGH_CANCELLED: "cancelled",
  
  // Project statuses (full lifecycle)
  INTAKE: "intake",
  INTAKE_SUBMITTED: "intake_submitted",
  PAYMENT_CONFIRMED: "payment_confirmed",
  ESTIMATOR_SCHEDULED: "estimator_scheduled",
  SITE_VISIT_COMPLETE: "site_visit_complete",
  SMART_ESTIMATE_IN_PROGRESS: "smart_estimate_in_progress",
  SMART_ESTIMATE_REVIEW: "smart_estimate_review",
  DESIGN_PACKAGE_IN_PROGRESS: "design_package_in_progress",
  DESIGN_PACKAGE_REVIEW: "design_package_review",
  DESIGN_PACKAGE_APPROVED: "design_package_approved",
  BID_PACKET_GENERATED: "bid_packet_generated",
  RFP_READY: "rfp_ready",
  RFP_OUT: "rfp_out",
  BIDDING_CLOSED: "bidding_closed",
  CONTRACTOR_SELECTED: "contractor_selected",
  WALKTHROUGH_SCHEDULED_PHASE: "walkthrough_scheduled",
  WALKTHROUGH_COMPLETE: "walkthrough_complete",
  ESTIMATING: "estimating",
  ESTIMATE_READY: "estimate_ready",
  ESTIMATE_APPROVED: "estimate_approved",
  PERMIT_PENDING: "permit_pending",
  PERMIT_APPROVED: "permit_approved",
  PROJECT_SCHEDULED: "scheduled",
  PROJECT_IN_PROGRESS: "in_progress",
  PROJECT_COMPLETE: "complete",
  PROJECT_CANCELLED: "cancelled",
} as const;

export const LEAD_STATUS = {
  NEW: "new",
  CONTACTED: "contacted", 
  QUALIFIED: "qualified",
  UNQUALIFIED: "unqualified",
  LOST: "lost",
} as const;

export const ESTIMATE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export const WALKTHROUGH_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const BID_PACKET_STATUS = {
  DRAFT: "draft",
  READY: "ready",
  RFP_OUT: "rfp_out",
  BIDDING_CLOSED: "bidding_closed",
  AWARDED: "awarded",
  ARCHIVED: "archived",
} as const;

export const BID_INVITE_STATUS = {
  INVITED: "invited",
  VIEWED: "viewed",
  SUBMITTED: "submitted",
  DECLINED: "declined",
} as const;

// Type exports
export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];
export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];
export type EstimateStatus = typeof ESTIMATE_STATUS[keyof typeof ESTIMATE_STATUS];
export type WalkthroughStatus = typeof WALKTHROUGH_STATUS[keyof typeof WALKTHROUGH_STATUS];
export type BidPacketStatus = typeof BID_PACKET_STATUS[keyof typeof BID_PACKET_STATUS];
export type BidInviteStatus = typeof BID_INVITE_STATUS[keyof typeof BID_INVITE_STATUS];

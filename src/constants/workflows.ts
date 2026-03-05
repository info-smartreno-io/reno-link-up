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
  
  // Project statuses  
  INTAKE: "intake",
  PAYMENT_CONFIRMED: "payment_confirmed",
  RFP_OUT: "rfp_out",
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

// Type exports
export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];
export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];
export type EstimateStatus = typeof ESTIMATE_STATUS[keyof typeof ESTIMATE_STATUS];
export type WalkthroughStatus = typeof WALKTHROUGH_STATUS[keyof typeof WALKTHROUGH_STATUS];

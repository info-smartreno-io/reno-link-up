import { QueryClient } from "@tanstack/react-query";

// Centralized list of all lead-related query keys
export const LEAD_QUERY_KEYS = [
  "leads",
  "contractor-leads",
  "pipeline-leads",
  "estimator-leads-table",
  "lead-activities",
  "lead-detail",
  "sales-pipeline",
  "portal-preview-stats",
  "contractor-stats",
  "homeowner-leads",
  "lead-stage-history",
  "estimator-dashboard-stats",
  "sales-kpi-data",
] as const;

/**
 * Invalidates all lead-related queries across the entire application.
 * Call this whenever a lead is created, updated, or when activities are recorded.
 */
export function invalidateAllLeadQueries(queryClient: QueryClient) {
  LEAD_QUERY_KEYS.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}

/**
 * Invalidates queries for a specific lead
 */
export function invalidateLeadQueries(queryClient: QueryClient, leadId: string) {
  queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
  queryClient.invalidateQueries({ queryKey: ["lead-activities", leadId] });
  queryClient.invalidateQueries({ queryKey: ["lead-stage-history", leadId] });
  // Also invalidate list queries since lead data may have changed
  invalidateAllLeadQueries(queryClient);
}

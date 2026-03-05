import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  zoning_pending: { label: "Zoning Review", variant: "default" },
  ucc_pending: { label: "UCC Review", variant: "default" },
  submitted: { label: "Submitted", variant: "default" },
  approved: { label: "Approved", variant: "outline" },
  revisions_required: { label: "Revisions Required", variant: "destructive" },
  closed: { label: "Closed", variant: "outline" },
};

export function PermitStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

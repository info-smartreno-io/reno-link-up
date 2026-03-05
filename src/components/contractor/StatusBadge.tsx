import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  intake: { label: "Intake", variant: "secondary" },
  rfp_out: { label: "Bidding", variant: "default" },
  contractor_selected: { label: "Selected", variant: "default" },
  contract_signed: { label: "Contract Signed", variant: "default" },
  pre_construction: { label: "Pre-Construction", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  punchlist: { label: "Punch List", variant: "secondary" },
  complete: { label: "Complete", variant: "outline" },
  archived: { label: "Archived", variant: "outline" }
};

export function StatusBadge({ value }: { value: string }) {
  const config = statusMap[value] ?? { label: value, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

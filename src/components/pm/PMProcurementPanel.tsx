import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PMProcurementPanelProps {
  projectId: string;
}

const vendorCategories = [
  { key: 'exterior', label: 'Exterior Subs', status: 'pending' },
  { key: 'mechanical', label: 'Mechanical Subs', status: 'pending' },
  { key: 'interior', label: 'Interior Subs', status: 'not_sent' },
  { key: 'kitchen_bath', label: 'Kitchen/Bath Vendor', status: 'scheduled' },
  { key: 'trim_doors_paint', label: 'Trim/Doors/Paint', status: 'not_scheduled' }
];

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    'awarded': { className: 'bg-green-500/20 text-green-500', label: 'Awarded' },
    'pending': { className: 'bg-amber-500/20 text-amber-500', label: 'Pending' },
    'scheduled': { className: 'bg-blue-500/20 text-blue-500', label: 'Scheduled' },
    'not_sent': { className: 'bg-muted text-muted-foreground', label: 'Not Sent' },
    'not_scheduled': { className: 'bg-muted text-muted-foreground', label: 'Not Scheduled' }
  };
  const variant = variants[status] || variants['not_sent'];
  return <Badge className={`${variant.className} border-0`}>{variant.label}</Badge>;
}

export function PMProcurementPanel({ projectId }: PMProcurementPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Procurement & Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vendorCategories.map((category) => (
            <div key={category.key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">{category.label}</span>
              <StatusBadge status={category.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
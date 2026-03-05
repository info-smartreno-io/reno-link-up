import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceTypePerformance } from "@/services/marketingAnalyticsService";

interface ServiceTypeTableProps {
  data: ServiceTypePerformance[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatServiceType = (type: string) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function ServiceTypeTable({ data, isLoading }: ServiceTypeTableProps) {
  const getCloseRateBadge = (rate: number) => {
    if (rate >= 50) {
      return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">{rate}%</Badge>;
    }
    if (rate >= 30) {
      return <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30">{rate}%</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30">{rate}%</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by Service Type</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Avg Value</TableHead>
              <TableHead className="text-right">Close Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.slice(0, 10).map((service) => (
                <TableRow key={service.serviceType}>
                  <TableCell className="font-medium">
                    {formatServiceType(service.serviceType)}
                  </TableCell>
                  <TableCell className="text-right">{service.leads}</TableCell>
                  <TableCell className="text-right">
                    {service.avgValue > 0 ? formatCurrency(service.avgValue) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {getCloseRateBadge(service.closeRate)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

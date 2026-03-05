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
import { TownPerformance } from "@/services/marketingAnalyticsService";

interface TownPerformanceTableProps {
  data: TownPerformance[];
  isLoading?: boolean;
}

export function TownPerformanceTable({ data, isLoading }: TownPerformanceTableProps) {
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
          <CardTitle>Leads by Town</CardTitle>
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
        <CardTitle>Leads by Town</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Town</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Qualified</TableHead>
              <TableHead className="text-right">Sold</TableHead>
              <TableHead className="text-right">Close Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.slice(0, 10).map((town) => (
                <TableRow key={town.town}>
                  <TableCell className="font-medium">{town.town}</TableCell>
                  <TableCell className="text-right">{town.leads}</TableCell>
                  <TableCell className="text-right">{town.qualified}</TableCell>
                  <TableCell className="text-right">{town.sold}</TableCell>
                  <TableCell className="text-right">
                    {getCloseRateBadge(town.closeRate)}
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

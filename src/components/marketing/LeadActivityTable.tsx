import { useState } from "react";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { marketingAnalyticsService } from "@/services/marketingAnalyticsService";

const STATUS_COLORS: Record<string, string> = {
  new_lead: "bg-blue-500/20 text-blue-600",
  call_24h: "bg-yellow-500/20 text-yellow-600",
  walkthrough: "bg-purple-500/20 text-purple-600",
  scope_sent: "bg-orange-500/20 text-orange-600",
  bid_room: "bg-indigo-500/20 text-indigo-600",
  bid_accepted: "bg-green-500/20 text-green-600",
  lost: "bg-red-500/20 text-red-600",
  closed_lost: "bg-red-500/20 text-red-600",
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function LeadActivityTable() {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: leads, isLoading } = useQuery({
    queryKey: ['marketing-lead-activity', sourceFilter, statusFilter],
    queryFn: () => marketingAnalyticsService.getLeadActivity({
      source: sourceFilter !== 'all' ? sourceFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      limit: 50,
    }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Lead Activity</CardTitle>
          <div className="flex gap-2">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new_lead">New Lead</SelectItem>
                <SelectItem value="call_24h">Call 24h</SelectItem>
                <SelectItem value="walkthrough">Walkthrough</SelectItem>
                <SelectItem value="scope_sent">Scope Sent</SelectItem>
                <SelectItem value="bid_room">Bid Room</SelectItem>
                <SelectItem value="bid_accepted">Bid Accepted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Town</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!leads || leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(lead.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lead.source || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.location || '-'}</TableCell>
                      <TableCell className="capitalize">
                        {lead.project_type?.replace(/_/g, ' ') || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[lead.status] || 'bg-muted text-muted-foreground'}>
                          {formatStatus(lead.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

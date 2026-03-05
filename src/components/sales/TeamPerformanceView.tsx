import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, TrendingUp, DollarSign, Target, ChevronRight } from "lucide-react";
import { Bar } from "react-chartjs-2";

interface TeamMemberMetrics {
  user_id: string;
  user_name: string;
  user_email: string;
  leads_count: number;
  walkthroughs_completed: number;
  estimates_sent: number;
  set_rate: number;
  close_rate: number;
  total_revenue: number;
  avg_ticket: number;
  rank: number;
}

interface TeamPerformanceViewProps {
  teamData: TeamMemberMetrics[];
  loading?: boolean;
}

export function TeamPerformanceView({ teamData, loading }: TeamPerformanceViewProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMemberMetrics | null>(null);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500"><Trophy className="w-3 h-3 mr-1" />1st</Badge>;
    if (rank === 2) return <Badge className="bg-slate-400">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600">3rd</Badge>;
    return <Badge variant="outline">{rank}th</Badge>;
  };

  const comparisonChartData = selectedMember ? {
    labels: ['Set Rate', 'Close Rate', 'Avg Ticket ($K)'],
    datasets: [
      {
        label: selectedMember.user_name,
        data: [
          selectedMember.set_rate,
          selectedMember.close_rate,
          selectedMember.avg_ticket / 1000,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
      {
        label: 'Team Average',
        data: [
          teamData.reduce((sum, m) => sum + m.set_rate, 0) / teamData.length,
          teamData.reduce((sum, m) => sum + m.close_rate, 0) / teamData.length,
          (teamData.reduce((sum, m) => sum + m.avg_ticket, 0) / teamData.length) / 1000,
        ],
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 2,
      },
    ],
  } : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading team data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!teamData || teamData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No team data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Team Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Set Rate</TableHead>
                <TableHead className="text-right">Close Rate</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Ticket</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.map((member) => (
                <TableRow key={member.user_id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{getRankBadge(member.rank)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.user_name}</div>
                      <div className="text-sm text-muted-foreground">{member.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{member.leads_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {member.set_rate.toFixed(1)}%
                      {member.set_rate >= 60 && <TrendingUp className="w-3 h-3 text-green-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {member.close_rate.toFixed(1)}%
                      {member.close_rate >= 50 && <Target className="w-3 h-3 text-blue-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3" />
                      {member.total_revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${member.avg_ticket.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMember(member)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMember?.user_name} - Detailed Performance
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{getRankBadge(selectedMember.rank)}</div>
                    <div className="text-sm text-muted-foreground">Team Rank</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedMember.leads_count}</div>
                    <div className="text-sm text-muted-foreground">Total Leads</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedMember.walkthroughs_completed}</div>
                    <div className="text-sm text-muted-foreground">Walkthroughs</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedMember.estimates_sent}</div>
                    <div className="text-sm text-muted-foreground">Estimates Sent</div>
                  </CardContent>
                </Card>
              </div>

              {comparisonChartData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance vs Team Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Bar
                      data={comparisonChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedMember.set_rate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Set Rate</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Team Avg: {(teamData.reduce((sum, m) => sum + m.set_rate, 0) / teamData.length).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedMember.close_rate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Close Rate</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Team Avg: {(teamData.reduce((sum, m) => sum + m.close_rate, 0) / teamData.length).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      ${selectedMember.total_revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      ${selectedMember.avg_ticket.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Ticket</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Team Avg: ${(teamData.reduce((sum, m) => sum + m.avg_ticket, 0) / teamData.length).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

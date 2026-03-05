import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Activity, Users, TrendingUp, Filter, RefreshCw, Eye, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  edge_function: string | null;
  event_data: any;
  error_message: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

interface EventSummary {
  event_type: string;
  severity: string;
  event_count: number;
  affected_users: number;
  first_occurrence: string;
  last_occurrence: string;
  unresolved_count: number;
}

interface HighRiskUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  security_event_count: number;
  critical_events: number;
  high_events: number;
  last_event_at: string;
  event_types: string[];
}

const AdminSecurityDashboard = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Fetch recent security events
  const { data: securityEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['security-events', selectedSeverity, selectedEventType],
    queryFn: async () => {
      let query = supabase
        .from('security_events' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedSeverity !== 'all') {
        query = query.eq('severity', selectedSeverity);
      }

      if (selectedEventType !== 'all') {
        query = query.eq('event_type', selectedEventType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as SecurityEvent[];
    },
  });

  // Fetch event summary
  const { data: eventSummary } = useQuery({
    queryKey: ['security-events-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events_summary' as any)
        .select('*')
        .order('severity', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as EventSummary[];
    },
  });

  // Fetch high-risk users
  const { data: highRiskUsers } = useQuery({
    queryKey: ['high-risk-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('high_risk_users' as any)
        .select('*')
        .limit(20);
      
      if (error) throw error;
      return (data || []) as unknown as HighRiskUser[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('security-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_events',
        },
        () => {
          refetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchEvents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const handleResolveEvent = async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from('security_events' as any)
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolution_notes: resolutionNotes,
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast.success('Security event resolved');
      setSelectedEvent(null);
      setResolutionNotes("");
      refetchEvents();
    } catch (error) {
      console.error('Error resolving event:', error);
      toast.error('Failed to resolve event');
    }
  };

  const unresolvedCount = securityEvents?.filter(e => !e.resolved_at).length || 0;
  const criticalCount = securityEvents?.filter(e => e.severity === 'critical' && !e.resolved_at).length || 0;
  const highCount = securityEvents?.filter(e => e.severity === 'high' && !e.resolved_at).length || 0;

  const filteredEvents = securityEvents?.filter(event => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      event.event_type.toLowerCase().includes(search) ||
      event.error_message?.toLowerCase().includes(search) ||
      event.ip_address?.includes(search) ||
      event.edge_function?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage security events in real-time</p>
          </div>
          <Button onClick={() => refetchEvents()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unresolvedCount}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
              <p className="text-xs text-muted-foreground">
                Immediate action needed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{highCount}</div>
              <p className="text-xs text-muted-foreground">
                Review recommended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High-Risk Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highRiskUsers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                In last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="summary">Event Summary</TabsTrigger>
            <TabsTrigger value="high-risk">High-Risk Users</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severity</label>
                    <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Event Type</label>
                    <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="auth_failure">Auth Failure</SelectItem>
                        <SelectItem value="validation_error">Validation Error</SelectItem>
                        <SelectItem value="rate_limit_exceeded">Rate Limit</SelectItem>
                        <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                        <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                        <SelectItem value="brute_force_detected">Brute Force</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>
                  {filteredEvents?.length || 0} events found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents?.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {event.event_type.replace(/_/g, ' ').toUpperCase()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.edge_function || 'System'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {event.ip_address || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {event.resolved_at ? (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="outline">Open</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Summary (Last 7 Days)</CardTitle>
                <CardDescription>Aggregated security event statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Total Events</TableHead>
                        <TableHead>Affected Users</TableHead>
                        <TableHead>Unresolved</TableHead>
                        <TableHead>Last Occurrence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventSummary?.map((summary, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {summary.event_type.replace(/_/g, ' ').toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityColor(summary.severity)}>
                              {summary.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{summary.event_count}</TableCell>
                          <TableCell>{summary.affected_users}</TableCell>
                          <TableCell>
                            <Badge variant={summary.unresolved_count > 0 ? "destructive" : "secondary"}>
                              {summary.unresolved_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(summary.last_occurrence), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="high-risk" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Users with multiple high or critical security events in the last 24 hours
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>High-Risk Users</CardTitle>
                <CardDescription>Users requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Total Events</TableHead>
                        <TableHead>Critical</TableHead>
                        <TableHead>High</TableHead>
                        <TableHead>Event Types</TableHead>
                        <TableHead>Last Event</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {highRiskUsers?.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">
                            {user.full_name || 'Unknown User'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge>{user.security_event_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{user.critical_events}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{user.high_events}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.event_types.slice(0, 3).join(', ')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.last_event_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Event Details Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Security Event Details</DialogTitle>
              <DialogDescription>
                Event ID: {selectedEvent?.id}
              </DialogDescription>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <div className="mt-1">
                      <Badge variant={getSeverityColor(selectedEvent.severity)}>
                        {selectedEvent.severity}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Event Type</label>
                    <p className="mt-1 text-sm">{selectedEvent.event_type}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Source</label>
                    <p className="mt-1 text-sm">{selectedEvent.edge_function || 'System'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">IP Address</label>
                    <p className="mt-1 text-sm font-mono">{selectedEvent.ip_address || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">User Agent</label>
                    <p className="mt-1 text-sm">{selectedEvent.user_agent || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Occurred</label>
                    <p className="mt-1 text-sm">
                      {formatDistanceToNow(new Date(selectedEvent.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {selectedEvent.error_message && (
                  <div>
                    <label className="text-sm font-medium">Error Message</label>
                    <Alert className="mt-1">
                      <AlertDescription>{selectedEvent.error_message}</AlertDescription>
                    </Alert>
                  </div>
                )}

                {selectedEvent.event_data && Object.keys(selectedEvent.event_data).length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Event Data</label>
                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto">
                      {JSON.stringify(selectedEvent.event_data, null, 2)}
                    </pre>
                  </div>
                )}

                {!selectedEvent.resolved_at && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add notes about how this was resolved..."
                      rows={3}
                    />
                    <Button onClick={handleResolveEvent} className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  </div>
                )}

                {selectedEvent.resolved_at && (
                  <div>
                    <label className="text-sm font-medium">Resolution</label>
                    <Alert className="mt-1">
                      <AlertDescription>
                        Resolved {formatDistanceToNow(new Date(selectedEvent.resolved_at), { addSuffix: true })}
                        {selectedEvent.resolution_notes && (
                          <p className="mt-2 text-sm">{selectedEvent.resolution_notes}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSecurityDashboard;

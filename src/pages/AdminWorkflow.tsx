import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar,
  ClipboardList,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  Phone,
  Video,
  Coffee,
  CircleDot,
  PowerOff,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowNav } from "@/components/admin/WorkflowNav";
import { toast } from "sonner";
import { AdminSideNav } from "@/components/AdminSideNav";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'in_walkthrough' | 'on_call' | 'away' | 'offline';
  current_activity?: string;
  activeLeads: number;
  completedToday: number;
}

interface Appointment {
  id: string;
  client_name: string;
  date: string;
  time: string;
  estimator: string;
  status: string;
}

export default function AdminWorkflow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeWalkthroughs: 0,
    pendingEstimates: 0,
    completedToday: 0,
    teamMembers: 9
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscription for team member status
    const statusChannel = supabase
      .channel('team-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_member_status'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch leads count
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Fetch walkthroughs count
      const { count: walkthroughsCount } = await supabase
        .from('walkthroughs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      // Fetch estimates count
      const { count: estimatesCount } = await supabase
        .from('estimates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      // Fetch today's completed walkthroughs
      const today = new Date().toISOString().split('T')[0];
      const { count: completedCount } = await supabase
        .from('walkthroughs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', today);

      // Fetch upcoming appointments
      const { data: walkthroughs } = await supabase
        .from('walkthroughs')
        .select(`
          id,
          client_name,
          date,
          time,
          status,
          user_id,
          profiles!walkthroughs_user_id_fkey(full_name)
        `)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(5);

      // Fetch team members with their stats and real-time status
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profiles!user_roles_user_id_fkey(full_name)
        `)
        .in('role', ['estimator', 'admin']);

      // Fetch team member statuses
      const { data: teamStatuses } = await supabase
        .from('team_member_status')
        .select('*');

      // Create a map of user statuses
      const statusMap = new Map(
        teamStatuses?.map(s => [s.user_id, s]) || []
      );

      // Build team members list with real status data
      const teamWithStatus: TeamMember[] = userRoles?.map((ur, index) => {
        const userStatus = statusMap.get(ur.user_id);
        const profile = ur.profiles as any;
        
        return {
          id: ur.user_id,
          name: profile?.full_name || `Team Member ${index + 1}`,
          role: ur.role === 'admin' ? 'Admin' : ur.role === 'estimator' ? 'Construction Agent' : 'Staff',
          status: userStatus?.status || 'available',
          current_activity: userStatus?.current_activity || undefined,
          activeLeads: Math.floor(Math.random() * 10) + 3, // In production, calculate from actual data
          completedToday: Math.floor(Math.random() * 5) + 1
        };
      }) || [];

      // Add mock coordinators and success managers for demonstration
      const mockAdditionalTeam: TeamMember[] = [
        { id: 'coord1', name: 'Lisa Brown', role: 'Project Coordinator', status: 'available', activeLeads: 12, completedToday: 4 },
        { id: 'coord2', name: 'Tom Wilson', role: 'Project Coordinator', status: 'on_call', current_activity: 'Client call - Kitchen project', activeLeads: 10, completedToday: 3 },
        { id: 'sm1', name: 'Rachel Green', role: 'Success Manager', status: 'available', activeLeads: 15, completedToday: 5 },
        { id: 'sm2', name: 'David Lee', role: 'Success Manager', status: 'away', activeLeads: 13, completedToday: 4 },
      ];

      setStats({
        totalLeads: leadsCount || 0,
        activeWalkthroughs: walkthroughsCount || 0,
        pendingEstimates: estimatesCount || 0,
        completedToday: completedCount || 0,
        teamMembers: 9
      });

      setTeamMembers([...teamWithStatus, ...mockAdditionalTeam]);

      setUpcomingAppointments(
        walkthroughs?.map(w => ({
          id: w.id,
          client_name: w.client_name,
          date: w.date,
          time: w.time,
          estimator: (w.profiles as any)?.full_name || 'Unassigned',
          status: w.status
        })) || []
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: TeamMember['status']) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          icon: '●'
        };
      case 'in_walkthrough':
        return {
          label: 'In Walkthrough',
          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          icon: '●'
        };
      case 'on_call':
        return {
          label: 'On Call',
          className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
          icon: '●'
        };
      case 'away':
        return {
          label: 'Away',
          className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: '●'
        };
      case 'offline':
        return {
          label: 'Offline',
          className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
          icon: '●'
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
          icon: '●'
        };
    }
  };

  const handleStatusChange = async (userId: string, newStatus: TeamMember['status'], activity?: string) => {
    try {
      // Check if status record exists
      const { data: existing } = await supabase
        .from('team_member_status')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing status
        const { error } = await supabase
          .from('team_member_status')
          .update({
            status: newStatus,
            current_activity: activity || null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new status
        const { error } = await supabase
          .from('team_member_status')
          .insert({
            user_id: userId,
            status: newStatus,
            current_activity: activity || null
          });

        if (error) throw error;
      }

      toast.success('Status updated successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const StatusDropdown = ({ member }: { member: TeamMember }) => {
    const [activityInput, setActivityInput] = useState(member.current_activity || '');
    const [showActivityInput, setShowActivityInput] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<TeamMember['status'] | null>(null);

    const statusOptions = [
      { value: 'available' as const, label: 'Available', icon: CircleDot, color: 'text-green-600' },
      { value: 'in_walkthrough' as const, label: 'In Walkthrough', icon: Video, color: 'text-blue-600' },
      { value: 'on_call' as const, label: 'On Call', icon: Phone, color: 'text-purple-600' },
      { value: 'away' as const, label: 'Away', icon: Coffee, color: 'text-yellow-600' },
      { value: 'offline' as const, label: 'Offline', icon: PowerOff, color: 'text-gray-600' },
    ];

    const handleStatusSelect = (status: TeamMember['status']) => {
      if (status === 'on_call' || status === 'in_walkthrough') {
        setSelectedStatus(status);
        setShowActivityInput(true);
      } else {
        handleStatusChange(member.id, status);
        setShowActivityInput(false);
      }
    };

    const handleActivitySubmit = () => {
      if (selectedStatus) {
        handleStatusChange(member.id, selectedStatus, activityInput);
      }
      setShowActivityInput(false);
      setSelectedStatus(null);
      setActivityInput('');
    };

    const handleCancel = () => {
      setShowActivityInput(false);
      setSelectedStatus(null);
      setActivityInput('');
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background border shadow-lg z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!showActivityInput ? (
            statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusSelect(option.value);
                  }}
                  className="cursor-pointer"
                >
                  <Icon className={`mr-2 h-4 w-4 ${option.color}`} />
                  {option.label}
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="p-2 space-y-2" onClick={(e) => e.stopPropagation()}>
              <Input
                placeholder="What are you working on?"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    handleActivitySubmit();
                  }
                }}
                className="h-8"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="h-7 text-xs flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivitySubmit();
                  }}
                  className="h-7 text-xs flex-1"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const SIDEBAR_WIDTH = 240;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30 fixed top-0 left-0 right-0 z-50 bg-background h-14" />
        <AdminSideNav topOffsetPx={56} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
        <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
          <div className="flex items-center justify-center h-[calc(100vh-56px)]">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading hub dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30 fixed top-0 left-0 right-0 z-50 bg-background h-14" />
      <AdminSideNav topOffsetPx={56} widthPx={SIDEBAR_WIDTH} collapsedWidthPx={56} />
      
      <div className="pt-14" style={{ paddingLeft: `${SIDEBAR_WIDTH}px` }}>
        <div className="container mx-auto px-6 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hub Dashboard</h1>
          <p className="text-muted-foreground">Monitor all team activities, appointments, and inquiries</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">Active inquiries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Walkthroughs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWalkthroughs}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Estimates</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingEstimates}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">Tasks done</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teamMembers}</div>
              <p className="text-xs text-muted-foreground">Active staff</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const statusConfig = getStatusConfig(member.status);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{member.name}</p>
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${statusConfig.className}`}>
                            <span className="animate-pulse">{statusConfig.icon}</span>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        {member.current_activity && (
                          <p className="text-xs text-muted-foreground italic mt-1 truncate">
                            {member.current_activity}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.activeLeads} active</p>
                          <p className="text-xs text-muted-foreground">{member.completedToday} today</p>
                        </div>
                        <StatusDropdown member={member} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hub Calendar - Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Hub Calendar - Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-shrink-0 w-16 text-center">
                        <p className="text-sm font-medium">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground">{apt.time}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{apt.client_name}</p>
                        <p className="text-sm text-muted-foreground">with {apt.estimator}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        apt.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate('/estimator/calendar')}
                  >
                    View Full Calendar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}

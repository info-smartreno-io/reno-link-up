import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Loader2, Calendar, CheckSquare, Square, Flag, Package, Wrench, Zap, Droplet, Wind, Hammer, CheckCircle, Plus, Bell, Send, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isAfter, addWeeks } from "date-fns";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoProjects, getDemoProjectTimelines } from "@/utils/demoContractorData";

interface Project {
  id: string;
  contractor_id: string;
  project_name: string;
  client_name: string;
  location: string;
  project_type: string;
  status: string;
  deadline: string | null;
  created_at: string;
  estimated_value: number | null;
  description: string | null;
}

interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  color: string;
  completed: boolean;
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  type: 'trade' | 'delivery' | 'inspection' | 'major';
  icon: typeof Flag | typeof Package | typeof Wrench | typeof CheckCircle;
  completed: boolean;
  description?: string;
}

interface Notification {
  id: string;
  project_id: string;
  contractor_id: string;
  notification_type: string;
  title: string;
  message: string;
  recipient_email: string | null;
  recipient_name: string | null;
  due_date: string | null;
  related_task_id: string | null;
  related_milestone_id: string | null;
  status: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function ContractorTimelines() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [resizingTask, setResizingTask] = useState<{ id: string; edge: 'left' | 'right' } | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [hoverEdge, setHoverEdge] = useState<{ taskId: string; edge: 'left' | 'right' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    date: '',
    type: 'trade' as 'trade' | 'delivery' | 'inspection' | 'major',
    description: '',
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isCreateNotificationOpen, setIsCreateNotificationOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    type: 'homeowner_action_needed' as string,
    title: '',
    message: '',
    recipientEmail: '',
    recipientName: '',
    dueDate: '',
  });

  useEffect(() => {
    if (isDemoMode) {
      // Load demo data
      const demoProjects = getDemoProjects().map(p => ({
        id: p.id,
        contractor_id: "demo-contractor",
        project_name: p.name,
        client_name: p.client_name,
        location: p.address,
        project_type: p.project_type,
        status: p.status,
        deadline: p.estimated_completion,
        created_at: p.start_date,
        estimated_value: p.amount,
        description: null,
      }));
      setProjects(demoProjects as any);
      if (demoProjects.length > 0) {
        setSelectedProjectId(demoProjects[0].id);
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    if (isDemoMode && selectedProjectId) {
      // Load demo timeline data
      const demoTimeline = getDemoProjectTimelines();
      setTasks(demoTimeline.tasks);
      setMilestones(demoTimeline.milestones.map(m => ({
        ...m,
        icon: m.iconName === 'Zap' ? Zap : m.iconName === 'Droplet' ? Droplet : m.iconName === 'Package' ? Package : m.iconName === 'CheckCircle' ? CheckCircle : Flag,
      })) as any);
      setNotifications(demoTimeline.notifications as any);
      return;
    }
    if (user && !isDemoMode) {
      fetchProjects();
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectTimeline();
      fetchNotifications();
    }
  }, [selectedProjectId, projects]);

  const fetchNotifications = async () => {
    if (!selectedProjectId) return;

    try {
      const { data, error } = await supabase
        .from('project_notifications')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('contractor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectTimeline = async () => {
    if (!selectedProjectId) return;

    try {
      // Fetch tasks from database
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch milestones from database
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('milestone_date', { ascending: true });

      if (milestonesError) throw milestonesError;

      // If no tasks exist, generate sample ones
      if (!tasksData || tasksData.length === 0) {
        generateProjectTasks();
      } else {
        // Map database tasks to UI format
        const uiTasks: Task[] = tasksData.map((dbTask, index) => ({
          id: dbTask.id,
          name: dbTask.task_name,
          startDate: new Date(dbTask.start_date),
          endDate: new Date(dbTask.end_date),
          progress: dbTask.progress,
          color: dbTask.color || `bg-${['blue', 'green', 'purple', 'orange', 'pink'][index % 5]}-500`,
          completed: dbTask.completed,
        }));
        setTasks(uiTasks);
      }

      // Map database milestones to UI format  
      if (milestonesData && milestonesData.length > 0) {
        const iconMap: Record<string, any> = {
          'Zap': Zap,
          'Droplet': Droplet,
          'Wind': Wind,
          'Hammer': Hammer,
          'Package': Package,
          'CheckCircle': CheckCircle,
          'Flag': Flag,
          'Wrench': Wrench,
        };

        const uiMilestones: Milestone[] = milestonesData.map(dbMilestone => ({
          id: dbMilestone.id,
          name: dbMilestone.milestone_name,
          date: new Date(dbMilestone.milestone_date),
          type: dbMilestone.milestone_type as 'trade' | 'delivery' | 'inspection' | 'major',
          icon: iconMap[dbMilestone.icon_name || 'Flag'] || Flag,
          completed: dbMilestone.completed,
          description: dbMilestone.description || undefined,
        }));
        setMilestones(uiMilestones);
      }
    } catch (error: any) {
      console.error('Error loading timeline:', error);
      // Fall back to generating sample data
      generateProjectTasks();
    }
  };

  const generateProjectTasks = () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) return;

    const startDate = new Date(selectedProject.created_at);
    const endDate = selectedProject.deadline ? new Date(selectedProject.deadline) : addDays(startDate, 90);

    // Generate sample tasks based on project type
    const projectDuration = differenceInDays(endDate, startDate);
    const taskColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];

    const sampleTasks: Task[] = [
      {
        id: '1',
        name: 'Initial Planning & Design',
        startDate: startDate,
        endDate: addDays(startDate, Math.floor(projectDuration * 0.15)),
        progress: 100,
        color: taskColors[0],
        completed: true,
      },
      {
        id: '2',
        name: 'Permits & Approvals',
        startDate: addDays(startDate, Math.floor(projectDuration * 0.10)),
        endDate: addDays(startDate, Math.floor(projectDuration * 0.25)),
        progress: 80,
        color: taskColors[1],
        completed: false,
      },
      {
        id: '3',
        name: 'Demolition & Site Prep',
        startDate: addDays(startDate, Math.floor(projectDuration * 0.25)),
        endDate: addDays(startDate, Math.floor(projectDuration * 0.35)),
        progress: 60,
        color: taskColors[2],
        completed: false,
      },
      {
        id: '4',
        name: 'Construction Phase',
        startDate: addDays(startDate, Math.floor(projectDuration * 0.35)),
        endDate: addDays(startDate, Math.floor(projectDuration * 0.80)),
        progress: 40,
        color: taskColors[3],
        completed: false,
      },
      {
        id: '5',
        name: 'Final Inspection & Cleanup',
        startDate: addDays(startDate, Math.floor(projectDuration * 0.80)),
        endDate: endDate,
        progress: 0,
        color: taskColors[4],
        completed: false,
      },
    ];

    setTasks(sampleTasks);

    // Generate milestones for trades and deliveries
    const sampleMilestones: Milestone[] = [
      {
        id: 'm1',
        name: 'Electrical Rough-In',
        date: addDays(startDate, Math.floor(projectDuration * 0.40)),
        type: 'trade',
        icon: Zap,
        completed: false,
        description: 'Electrical contractor to complete rough-in work',
      },
      {
        id: 'm2',
        name: 'Plumbing Installation',
        date: addDays(startDate, Math.floor(projectDuration * 0.42)),
        type: 'trade',
        icon: Droplet,
        completed: false,
        description: 'Main plumbing fixtures installed',
      },
      {
        id: 'm3',
        name: 'HVAC Installation',
        date: addDays(startDate, Math.floor(projectDuration * 0.45)),
        type: 'trade',
        icon: Wind,
        completed: false,
        description: 'HVAC system installed and tested',
      },
      {
        id: 'm4',
        name: 'Flooring Delivery',
        date: addDays(startDate, Math.floor(projectDuration * 0.50)),
        type: 'delivery',
        icon: Package,
        completed: false,
        description: 'Hardwood flooring materials delivered to site',
      },
      {
        id: 'm5',
        name: 'Cabinet Delivery',
        date: addDays(startDate, Math.floor(projectDuration * 0.55)),
        type: 'delivery',
        icon: Package,
        completed: false,
        description: 'Custom cabinets delivered',
      },
      {
        id: 'm6',
        name: 'Countertop Installation',
        date: addDays(startDate, Math.floor(projectDuration * 0.60)),
        type: 'trade',
        icon: Hammer,
        completed: false,
        description: 'Granite countertops templated and installed',
      },
      {
        id: 'm7',
        name: 'Appliance Delivery',
        date: addDays(startDate, Math.floor(projectDuration * 0.65)),
        type: 'delivery',
        icon: Package,
        completed: false,
        description: 'Major appliances delivered',
      },
      {
        id: 'm8',
        name: 'Mid-Project Inspection',
        date: addDays(startDate, Math.floor(projectDuration * 0.70)),
        type: 'inspection',
        icon: CheckCircle,
        completed: false,
        description: 'Required building inspection',
      },
      {
        id: 'm9',
        name: 'Final Inspection',
        date: addDays(startDate, Math.floor(projectDuration * 0.95)),
        type: 'inspection',
        icon: CheckCircle,
        completed: false,
        description: 'Final building inspection and approval',
      },
      {
        id: 'm10',
        name: 'Project Completion',
        date: endDate,
        type: 'major',
        icon: Flag,
        completed: false,
        description: 'Project handover to client',
      },
    ];

    setMilestones(sampleMilestones);
  };

  const getDaysInView = () => {
    const start = startOfMonth(viewMonth);
    const end = endOfMonth(viewMonth);
    return eachDayOfInterval({ start, end });
  };

  const getTaskPosition = (task: Task, days: Date[]) => {
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    
    const taskStart = task.startDate < firstDay ? firstDay : task.startDate;
    const taskEnd = task.endDate > lastDay ? lastDay : task.endDate;
    
    const startIndex = differenceInDays(taskStart, firstDay);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    return {
      left: `${(startIndex / days.length) * 100}%`,
      width: `${(duration / days.length) * 100}%`,
    };
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const toggleMilestoneComplete = (milestoneId: string) => {
    setMilestones(prev => prev.map(milestone => 
      milestone.id === milestoneId ? { ...milestone, completed: !milestone.completed } : milestone
    ));
  };

  const getMilestonePosition = (milestone: Milestone, days: Date[]) => {
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    
    if (milestone.date < firstDay || milestone.date > lastDay) {
      return null; // Milestone not in current view
    }
    
    const dayIndex = differenceInDays(milestone.date, firstDay);
    return {
      left: `${(dayIndex / days.length) * 100}%`,
    };
  };

  const isNearEdge = (mouseX: number, barLeft: number, barWidth: number): 'left' | 'right' | null => {
    const edgeThreshold = 10; // pixels
    const barRight = barLeft + barWidth;
    
    if (Math.abs(mouseX - barLeft) < edgeThreshold) return 'left';
    if (Math.abs(mouseX - barRight) < edgeThreshold) return 'right';
    return null;
  };

  const handleBarMouseMove = (e: React.MouseEvent, taskId: string) => {
    if (draggingTask || resizingTask) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edge = isNearEdge(mouseX, 0, rect.width);

    if (edge) {
      setHoverEdge({ taskId, edge });
    } else {
      setHoverEdge(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edge = isNearEdge(mouseX, 0, rect.width);

    if (edge) {
      setResizingTask({ id: taskId, edge });
    } else {
      setDraggingTask(taskId);
    }
    
    setDragStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTask && !resizingTask) return;
    if (!timelineRef.current) return;

    const offset = e.clientX - dragStartX;
    setDragOffset(offset);
  };

  const handleMouseUp = async () => {
    if (!timelineRef.current) return;

    const days = getDaysInView();
    const timelineWidth = timelineRef.current.offsetWidth;
    const pixelsPerDay = timelineWidth / days.length;
    const daysMoved = Math.round(dragOffset / pixelsPerDay);

    if (draggingTask && daysMoved !== 0) {
      const taskToUpdate = tasks.find(t => t.id === draggingTask);
      if (taskToUpdate) {
        const newStartDate = addDays(taskToUpdate.startDate, daysMoved);
        const newEndDate = addDays(taskToUpdate.endDate, daysMoved);

        // Update in database if it's a database task (UUID format)
        if (draggingTask.length > 10) {
          try {
            await supabase
              .from('project_tasks')
              .update({
                start_date: format(newStartDate, 'yyyy-MM-dd'),
                end_date: format(newEndDate, 'yyyy-MM-dd'),
              })
              .eq('id', draggingTask);
          } catch (error) {
            console.error('Error updating task:', error);
          }
        }
        
        setTasks(prev => prev.map(task => {
          if (task.id === draggingTask) {
            toast({
              title: "Task Rescheduled",
              description: `${task.name} moved by ${Math.abs(daysMoved)} day${Math.abs(daysMoved) !== 1 ? 's' : ''} ${daysMoved > 0 ? 'forward' : 'backward'}`,
            });

            return {
              ...task,
              startDate: newStartDate,
              endDate: newEndDate,
            };
          }
          return task;
        }));
      }
    }

    if (resizingTask && daysMoved !== 0) {
      const taskToUpdate = tasks.find(t => t.id === resizingTask.id);
      if (taskToUpdate) {
        let newStartDate = taskToUpdate.startDate;
        let newEndDate = taskToUpdate.endDate;

        if (resizingTask.edge === 'left') {
          newStartDate = addDays(taskToUpdate.startDate, daysMoved);
          if (newStartDate >= taskToUpdate.endDate) {
            newStartDate = addDays(taskToUpdate.endDate, -1);
          }
        } else {
          newEndDate = addDays(taskToUpdate.endDate, daysMoved);
          if (newEndDate <= taskToUpdate.startDate) {
            newEndDate = addDays(taskToUpdate.startDate, 1);
          }
        }

        // Update in database if it's a database task (UUID format)
        if (resizingTask.id.length > 10) {
          try {
            await supabase
              .from('project_tasks')
              .update({
                start_date: format(newStartDate, 'yyyy-MM-dd'),
                end_date: format(newEndDate, 'yyyy-MM-dd'),
              })
              .eq('id', resizingTask.id);
          } catch (error) {
            console.error('Error updating task:', error);
          }
        }

        setTasks(prev => prev.map(task => {
          if (task.id === resizingTask.id) {
            const newDuration = differenceInDays(newEndDate, newStartDate);
            
            toast({
              title: "Task Duration Adjusted",
              description: `${task.name} duration changed to ${newDuration + 1} day${newDuration !== 0 ? 's' : ''}`,
            });

            return {
              ...task,
              startDate: newStartDate,
              endDate: newEndDate,
            };
          }
          return task;
        }));
      }
    }

    setDraggingTask(null);
    setResizingTask(null);
    setDragStartX(0);
    setDragOffset(0);
    setHoverEdge(null);
  };

  const handleMouseLeave = () => {
    if (draggingTask || resizingTask) {
      setDraggingTask(null);
      setResizingTask(null);
      setDragStartX(0);
      setDragOffset(0);
    }
    setHoverEdge(null);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    // Only handle clicks on the timeline grid itself
    if ((e.target as HTMLElement).classList.contains('timeline-grid')) {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const days = getDaysInView();
      const dayIndex = Math.floor((clickX / rect.width) * days.length);
      const clickedDate = days[dayIndex];
      
      if (clickedDate) {
        setNewMilestone({
          name: '',
          date: format(clickedDate, 'yyyy-MM-dd'),
          type: 'trade',
          description: '',
        });
        setIsCreateMilestoneOpen(true);
      }
    }
  };

  const handleCreateMilestone = () => {
    if (!newMilestone.name || !newMilestone.date) {
      toast({
        title: "Validation Error",
        description: "Please provide a name and date for the milestone.",
        variant: "destructive",
      });
      return;
    }

    const iconMap = {
      trade: Wrench,
      delivery: Package,
      inspection: CheckCircle,
      major: Flag,
    };

    const milestone: Milestone = {
      id: `custom-${Date.now()}`,
      name: newMilestone.name,
      date: new Date(newMilestone.date),
      type: newMilestone.type,
      icon: iconMap[newMilestone.type],
      completed: false,
      description: newMilestone.description,
    };

    setMilestones(prev => [...prev, milestone].sort((a, b) => a.date.getTime() - b.date.getTime()));
    
    toast({
      title: "Milestone Created",
      description: `${newMilestone.name} added to timeline`,
    });

    setIsCreateMilestoneOpen(false);
    setNewMilestone({
      name: '',
      date: '',
      type: 'trade',
      description: '',
    });
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message || !newNotification.recipientEmail) {
      toast({
        title: "Validation Error",
        description: "Please provide title, message, and recipient email.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProjectId || !user) return;

    try {
      const { data, error } = await supabase
        .from('project_notifications')
        .insert([{
          project_id: selectedProjectId,
          contractor_id: user.id,
          notification_type: newNotification.type as any,
          title: newNotification.title,
          message: newNotification.message,
          recipient_email: newNotification.recipientEmail,
          recipient_name: newNotification.recipientName || null,
          due_date: newNotification.dueDate || null,
          status: 'pending' as any,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Notification Created",
        description: "Notification has been created successfully.",
      });

      setIsCreateNotificationOpen(false);
      setNewNotification({
        type: 'homeowner_action_needed',
        title: '',
        message: '',
        recipientEmail: '',
        recipientName: '',
        dueDate: '',
      });

      fetchNotifications();
    } catch (error: any) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification.",
        variant: "destructive",
      });
    }
  };

  const handleSendNotification = async (notificationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-project-notification', {
        body: { notificationId },
      });

      if (error) throw error;

      toast({
        title: "Notification Sent",
        description: "Email notification has been sent successfully.",
      });

      fetchNotifications();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification.",
        variant: "destructive",
      });
    }
  };

  const handleAcknowledgeNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('project_notifications')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Notification Acknowledged",
        description: "Notification has been marked as acknowledged.",
      });

      fetchNotifications();
    } catch (error: any) {
      console.error('Error acknowledging notification:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge notification.",
        variant: "destructive",
      });
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const days = getDaysInView();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ContractorLayout>
      <div className="min-h-screen bg-background -m-6">
        <header className="bg-white border-b sticky top-0 z-40 px-4 py-4">
          <div className="flex items-center justify-end">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.client_name} - {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Project Timelines</h1>
          <p className="text-muted-foreground">
            Track project progress, timelines, and tasks
          </p>
        </div>

        {selectedProject && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Project Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={
                  selectedProject.status === 'completed' ? 'default' :
                  selectedProject.status === 'in_progress' ? 'secondary' : 'outline'
                }>
                  {selectedProject.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Deadline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {selectedProject.deadline ? format(new Date(selectedProject.deadline), 'MMM dd, yyyy') : 'Not set'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Project Value</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="font-semibold text-lg">
                  ${selectedProject.estimated_value?.toLocaleString() || '0'}
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Gantt Chart */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>Visual project schedule</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(viewMonth, 'MMMM yyyy')}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button
                  onClick={() => setIsCreateMilestoneOpen(true)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Milestone
                </Button>
              </div>
              <div 
                className="overflow-x-auto"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {/* Timeline Header */}
                <div className="flex border-b mb-4 pb-2">
                  <div className="w-48 font-semibold text-sm">Task</div>
                  <div className="flex-1 flex" ref={timelineRef}>
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className="flex-1 text-center text-xs text-muted-foreground timeline-grid"
                        style={{ minWidth: '30px' }}
                        onClick={handleTimelineClick}
                      >
                        {format(day, 'd')}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Rows */}
                <div className="space-y-4 relative">
                  {/* Milestone markers layer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {milestones.map((milestone) => {
                      const position = getMilestonePosition(milestone, days);
                      if (!position) return null;

                      const MilestoneIcon = milestone.icon;
                      const typeColors = {
                        trade: 'bg-blue-500',
                        delivery: 'bg-orange-500',
                        inspection: 'bg-purple-500',
                        major: 'bg-green-500',
                      };

                      return (
                        <div
                          key={milestone.id}
                          className="absolute top-0 bottom-0 pointer-events-auto"
                          style={{ left: position.left }}
                        >
                          <div className="relative h-full flex flex-col items-center">
                            {/* Vertical line */}
                            <div className={`w-0.5 h-full ${milestone.completed ? 'bg-muted-foreground/30' : typeColors[milestone.type]}`} />
                            
                            {/* Icon at top */}
                            <div 
                              className={`absolute -top-1 ${typeColors[milestone.type]} rounded-full p-1.5 cursor-pointer hover:scale-110 transition-transform ${milestone.completed ? 'opacity-50' : ''}`}
                              title={`${milestone.name}\n${milestone.description || ''}\n${format(milestone.date, 'MMM dd, yyyy')}`}
                              onClick={() => toggleMilestoneComplete(milestone.id)}
                            >
                              <MilestoneIcon className="h-3 w-3 text-white" />
                            </div>
                            
                            {/* Label */}
                            <div className="absolute -top-8 whitespace-nowrap text-xs font-medium pointer-events-none">
                              <div className={`px-2 py-1 rounded ${typeColors[milestone.type]} text-white ${milestone.completed ? 'line-through opacity-50' : ''}`}>
                                {milestone.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {tasks.map((task) => {
                    const position = getTaskPosition(task, days);
                    const isDragging = draggingTask === task.id;
                    const isResizing = resizingTask?.id === task.id;
                    const isHoveringLeft = hoverEdge?.taskId === task.id && hoverEdge.edge === 'left';
                    const isHoveringRight = hoverEdge?.taskId === task.id && hoverEdge.edge === 'right';
                    
                    let leftOffset = position.left;
                    let barWidth = position.width;

                    if (isDragging) {
                      leftOffset = `calc(${position.left} + ${dragOffset}px)`;
                    } else if (isResizing) {
                      if (resizingTask.edge === 'left') {
                        leftOffset = `calc(${position.left} + ${dragOffset}px)`;
                        barWidth = `calc(${position.width} - ${dragOffset}px)`;
                      } else {
                        barWidth = `calc(${position.width} + ${dragOffset}px)`;
                      }
                    }

                    return (
                      <div key={task.id} className="flex items-center">
                        <div className="w-48 text-sm font-medium truncate pr-4">
                          {task.name}
                        </div>
                        <div className="flex-1 relative h-8 bg-muted/30 rounded">
                          <div
                            className={`absolute h-full ${task.color} rounded flex items-center justify-center text-white text-xs font-medium select-none transition-opacity ${
                              isDragging || isResizing 
                                ? 'opacity-70 cursor-grabbing' 
                                : isHoveringLeft || isHoveringRight
                                ? 'opacity-90'
                                : 'hover:opacity-90 cursor-grab'
                            } ${isHoveringLeft ? 'cursor-ew-resize' : ''} ${isHoveringRight ? 'cursor-ew-resize' : ''}`}
                            style={{
                              left: leftOffset,
                              width: barWidth,
                              transition: (isDragging || isResizing) ? 'none' : 'all 0.2s ease',
                            }}
                            onMouseDown={(e) => handleMouseDown(e, task.id)}
                            onMouseMove={(e) => handleBarMouseMove(e, task.id)}
                            title={`${format(task.startDate, 'MMM dd')} - ${format(task.endDate, 'MMM dd')} (drag to move, drag edges to resize)`}
                          >
                            {/* Left resize handle indicator */}
                            {isHoveringLeft && !isDragging && !isResizing && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50" />
                            )}
                            {task.progress}%
                            {/* Right resize handle indicator */}
                            {isHoveringRight && !isDragging && !isResizing && (
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks & Milestones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks & Milestones</CardTitle>
                  <CardDescription>Project tasks and key milestones</CardDescription>
                </div>
                <Button
                  onClick={() => setIsCreateNotificationOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  New Reminder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Tasks */}
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleTaskComplete(task.id)}
                  >
                    {task.completed ? (
                      <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(task.startDate, 'MMM dd')} - {format(task.endDate, 'MMM dd')}
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${task.color}`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Milestones */}
                <div className="pt-2 mt-2 border-t">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">MILESTONES</h4>
                  {milestones.map((milestone) => {
                    const MilestoneIcon = milestone.icon;
                    const typeColors = {
                      trade: 'text-blue-500',
                      delivery: 'text-orange-500',
                      inspection: 'text-purple-500',
                      major: 'text-green-500',
                    };
                    const typeBgColors = {
                      trade: 'bg-blue-500/10',
                      delivery: 'bg-orange-500/10',
                      inspection: 'bg-purple-500/10',
                      major: 'bg-green-500/10',
                    };

                    return (
                      <div
                        key={milestone.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${typeBgColors[milestone.type]}`}
                        onClick={() => toggleMilestoneComplete(milestone.id)}
                      >
                        <div className={`mt-0.5 ${milestone.completed ? 'opacity-50' : ''}`}>
                          <MilestoneIcon className={`h-5 w-5 ${typeColors[milestone.type]}`} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {milestone.name}
                          </div>
                          {milestone.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {milestone.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(milestone.date, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notifications Section */}
                {notifications.length > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">NOTIFICATIONS & REMINDERS</h4>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {notifications.map((notification) => {
                          const typeColors = {
                            task_starting: 'text-blue-500 bg-blue-500/10',
                            task_due: 'text-orange-500 bg-orange-500/10',
                            milestone_approaching: 'text-purple-500 bg-purple-500/10',
                            homeowner_action_needed: 'text-red-500 bg-red-500/10',
                            contractor_action_needed: 'text-yellow-500 bg-yellow-500/10',
                            material_delivery: 'text-green-500 bg-green-500/10',
                            inspection_scheduled: 'text-indigo-500 bg-indigo-500/10',
                          };

                          return (
                            <div
                              key={notification.id}
                              className={`p-3 border rounded-lg ${typeColors[notification.notification_type as keyof typeof typeColors] || 'bg-muted/10'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{notification.title}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {notification.message}
                                  </div>
                                  {notification.recipient_name && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      To: {notification.recipient_name}
                                    </div>
                                  )}
                                  {notification.due_date && (
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Due: {format(new Date(notification.due_date), 'MMM dd, yyyy')}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={
                                      notification.status === 'sent' ? 'secondary' :
                                      notification.status === 'acknowledged' ? 'default' : 'outline'
                                    } className="text-xs">
                                      {notification.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  {notification.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSendNotification(notification.id)}
                                      className="h-7 w-7 p-0"
                                      title="Send notification"
                                    >
                                      <Send className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {notification.status === 'sent' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleAcknowledgeNotification(notification.id)}
                                      className="h-7 w-7 p-0"
                                      title="Mark as acknowledged"
                                    >
                                      <CheckCheck className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Milestone Dialog */}
      <Dialog open={isCreateMilestoneOpen} onOpenChange={setIsCreateMilestoneOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Custom Milestone</DialogTitle>
            <DialogDescription>
              Add a custom milestone to track important project events, deliveries, or inspections.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="milestone-name">Name</Label>
              <Input
                id="milestone-name"
                placeholder="e.g., Drywall Installation"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="milestone-date">Date</Label>
              <Input
                id="milestone-date"
                type="date"
                value={newMilestone.date}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="milestone-type">Type</Label>
              <Select
                value={newMilestone.type}
                onValueChange={(value: 'trade' | 'delivery' | 'inspection' | 'major') => 
                  setNewMilestone(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger id="milestone-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trade">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-500" />
                      Trade Work
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      Material Delivery
                    </div>
                  </SelectItem>
                  <SelectItem value="inspection">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      Inspection
                    </div>
                  </SelectItem>
                  <SelectItem value="major">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-green-500" />
                      Major Milestone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="milestone-description">Description (optional)</Label>
              <Textarea
                id="milestone-description"
                placeholder="Add details about this milestone..."
                value={newMilestone.description}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateMilestoneOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMilestone}>
              Create Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateNotificationOpen} onOpenChange={setIsCreateNotificationOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Project Notification</DialogTitle>
            <DialogDescription>
              Send reminders and action items to homeowners or team members to keep the project moving forward.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="notification-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homeowner_action_needed">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-red-500" />
                      Homeowner Action Needed
                    </div>
                  </SelectItem>
                  <SelectItem value="contractor_action_needed">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-yellow-500" />
                      Contractor Action Needed
                    </div>
                  </SelectItem>
                  <SelectItem value="task_starting">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Task Starting Soon
                    </div>
                  </SelectItem>
                  <SelectItem value="task_due">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      Task Due Date
                    </div>
                  </SelectItem>
                  <SelectItem value="material_delivery">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      Material Delivery
                    </div>
                  </SelectItem>
                  <SelectItem value="inspection_scheduled">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                      Inspection Scheduled
                    </div>
                  </SelectItem>
                  <SelectItem value="milestone_approaching">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-purple-500" />
                      Milestone Approaching
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notification-title">Title</Label>
              <Input
                id="notification-title"
                placeholder="e.g., Color selections needed for kitchen cabinets"
                value={newNotification.title}
                onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                placeholder="Provide details about what action is needed..."
                value={newNotification.message}
                onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="recipient-name">Recipient Name</Label>
                <Input
                  id="recipient-name"
                  placeholder="e.g., John Smith"
                  value={newNotification.recipientName}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, recipientName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recipient-email">Recipient Email *</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="e.g., john@example.com"
                  value={newNotification.recipientEmail}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, recipientEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notification-due-date">Due Date (optional)</Label>
              <Input
                id="notification-due-date"
                type="date"
                value={newNotification.dueDate}
                onChange={(e) => setNewNotification(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateNotificationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNotification}>
              Create Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ContractorLayout>
  );
}

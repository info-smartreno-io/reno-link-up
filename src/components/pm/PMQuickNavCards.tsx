import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  FolderKanban, 
  FileEdit, 
  Calendar, 
  CalendarClock, 
  ClipboardCheck, 
  BookOpen 
} from "lucide-react";

interface QuickNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const quickNavItems: QuickNavItem[] = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: FolderKanban,
    path: '/contractor/project-manager-pipeline',
    description: 'View project stages'
  },
  {
    id: 'change-orders',
    label: 'Change Orders',
    icon: FileEdit,
    path: '/contractor/change-orders',
    description: 'Manage COs'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    path: '/contractor/calendar',
    description: 'Schedule overview'
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: CalendarClock,
    path: '/contractor/pm-appointments',
    description: 'Site visits & meetings'
  },
  {
    id: 'permits',
    label: 'Permits',
    icon: ClipboardCheck,
    path: '/contractor/permit-tracking',
    description: 'Track permit status'
  },
  {
    id: 'daily-logs',
    label: 'Daily Logs',
    icon: BookOpen,
    path: '/admin/daily-logs',
    description: 'Job site reports'
  }
];

export function PMQuickNavCards() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick Navigation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickNavItems.map(item => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="outline"
                className="h-auto flex-col items-center justify-center py-4 px-3 gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground hidden md:block">{item.description}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

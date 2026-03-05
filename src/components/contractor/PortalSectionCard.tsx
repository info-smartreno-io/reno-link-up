import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
}

interface PortalSectionCardProps {
  title: string;
  icon: LucideIcon;
  stats: StatItem[];
  href: string;
  accentColor?: string;
  notificationCount?: number;
}

export function PortalSectionCard({
  title,
  icon: Icon,
  stats,
  href,
  accentColor = "bg-primary",
  notificationCount = 0
}: PortalSectionCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 relative overflow-hidden"
      onClick={() => navigate(href)}
    >
      {/* Accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", accentColor)} />
      
      {/* Notification badge */}
      {notificationCount > 0 && (
        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {notificationCount > 9 ? '9+' : notificationCount}
        </div>
      )}

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg", accentColor.replace('bg-', 'bg-').concat('/10'))}>
            <Icon className={cn("h-5 w-5", accentColor.replace('bg-', 'text-'))} />
          </div>
          <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className="font-semibold text-foreground">{stat.value}</span>
          </div>
        ))}

        <Button 
          variant="ghost" 
          className="w-full mt-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

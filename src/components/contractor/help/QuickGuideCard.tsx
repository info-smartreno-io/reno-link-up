import { ChevronDown, PlayCircle, Image, LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GuideStep {
  step: number;
  title: string;
  description: string;
}

interface QuickGuideCardProps {
  title: string;
  icon: LucideIcon;
  steps: GuideStep[];
  videoUrl?: string;
  onWatchVideo?: () => void;
  onViewScreenshots?: () => void;
  defaultOpen?: boolean;
}

export function QuickGuideCard({
  title,
  icon: Icon,
  steps,
  videoUrl,
  onWatchVideo,
  onViewScreenshots,
  defaultOpen = false,
}: QuickGuideCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border bg-card p-4">
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.step} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {step.step}
              </div>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        
        {(onWatchVideo || onViewScreenshots) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            {onWatchVideo && (
              <Button variant="outline" size="sm" onClick={onWatchVideo}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Watch Video
              </Button>
            )}
            {onViewScreenshots && (
              <Button variant="outline" size="sm" onClick={onViewScreenshots}>
                <Image className="mr-2 h-4 w-4" />
                View Screenshots
              </Button>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

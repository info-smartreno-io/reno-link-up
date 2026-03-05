import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TabOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface MobileScrollTabsProps {
  tabs: TabOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function MobileScrollTabs({
  tabs,
  value,
  onValueChange,
  className,
}: MobileScrollTabsProps) {
  return (
    <ScrollArea className={cn("w-full whitespace-nowrap", className)}>
      <div className="flex gap-2 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
              "min-h-[44px] min-w-max touch-manipulation",
              "border border-border",
              value === tab.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
}

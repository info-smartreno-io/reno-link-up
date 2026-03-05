import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PMPhaseStatusBarProps {
  currentPhase: string;
}

const phases = [
  { key: 'sales', label: 'Sales' },
  { key: 'pre_construction', label: 'Pre-Construction' },
  { key: 'procurement', label: 'Procurement' },
  { key: 'construction', label: 'Construction' },
  { key: 'closeout', label: 'Closeout' }
];

const phaseOrder: Record<string, number> = {
  'new': 0,
  'sales': 1,
  'proposal_sent': 1,
  'contract_signed': 1,
  'pre_construction': 2,
  'pm_pre_construction': 2,
  'procurement': 3,
  'construction': 4,
  'pm_in_progress': 4,
  'closeout': 5,
  'completed': 6
};

export function PMPhaseStatusBar({ currentPhase }: PMPhaseStatusBarProps) {
  const currentPhaseIndex = phaseOrder[currentPhase] || 0;

  return (
    <div className="flex items-center justify-between w-full py-4">
      {phases.map((phase, index) => {
        const phaseIndex = index + 1;
        const isCompleted = currentPhaseIndex > phaseIndex;
        const isCurrent = currentPhaseIndex === phaseIndex;
        const isPending = currentPhaseIndex < phaseIndex;

        return (
          <div key={phase.key} className="flex items-center flex-1">
            {/* Phase indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-amber-500 border-amber-500 text-white animate-pulse",
                  isPending && "bg-muted border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : isCurrent ? (
                  "⚠"
                ) : (
                  "⏳"
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium text-center",
                  isCompleted && "text-green-500",
                  isCurrent && "text-amber-500",
                  isPending && "text-muted-foreground"
                )}
              >
                {phase.label}
              </span>
            </div>

            {/* Connector line */}
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  currentPhaseIndex > phaseIndex + 1
                    ? "bg-green-500"
                    : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
import { cn } from "@/lib/utils";
import { TrendingUp, DollarSign, Clock, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadScoreProps {
  score: number;
  budgetScore?: number;
  responseScore?: number;
  progressionScore?: number;
  variant?: "default" | "compact" | "detailed";
}

export function LeadScore({
  score,
  budgetScore = 0,
  responseScore = 0,
  progressionScore = 0,
  variant = "default",
}: LeadScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-blue-500/10 border-blue-500/20";
    if (score >= 40) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Hot Lead";
    if (score >= 60) return "Warm Lead";
    if (score >= 40) return "Cool Lead";
    return "Cold Lead";
  };

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md border", getScoreBg(score))}>
              <Award className={cn("h-3.5 w-3.5", getScoreColor(score))} />
              <span className={cn("text-sm font-bold", getScoreColor(score))}>
                {score}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3">
            <div className="space-y-2">
              <div className="font-semibold">{getScoreLabel(score)}</div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-green-500" />
                  <span>{budgetScore}/40</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span>{responseScore}/30</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  <span>{progressionScore}/30</span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("p-4 rounded-lg border-2", getScoreBg(score))}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className={cn("h-5 w-5", getScoreColor(score))} />
            <span className={cn("text-2xl font-bold", getScoreColor(score))}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Badge variant={score >= 60 ? "default" : "secondary"}>
            {getScoreLabel(score)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-muted-foreground">Budget Value</span>
            </div>
            <span className="font-semibold">{budgetScore} / 40</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${(budgetScore / 40) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-muted-foreground">Response Time</span>
            </div>
            <span className="font-semibold">{responseScore} / 30</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(responseScore / 30) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-muted-foreground">Stage Progress</span>
            </div>
            <span className="font-semibold">{progressionScore} / 30</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${(progressionScore / 30) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn("px-3 py-1.5 rounded-lg border-2 flex items-center gap-2", getScoreBg(score))}>
        <Award className={cn("h-4 w-4", getScoreColor(score))} />
        <span className={cn("text-lg font-bold", getScoreColor(score))}>
          {score}
        </span>
      </div>
      <Badge variant={score >= 60 ? "default" : "secondary"} className="text-xs">
        {getScoreLabel(score)}
      </Badge>
    </div>
  );
}

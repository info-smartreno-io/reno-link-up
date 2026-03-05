import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, Target } from "lucide-react";

interface KpiProgressCardProps {
  label: string;
  actual: number;
  target: number | null;
  formatter: (v: number) => string;
  delta?: number;
  compare?: boolean;
}

export function KpiProgressCard({
  label,
  actual,
  target,
  formatter,
  delta,
  compare,
}: KpiProgressCardProps) {
  const progress = target ? Math.min((actual / target) * 100, 100) : null;
  const isAboveTarget = target ? actual >= target : false;
  const difference = target ? actual - target : 0;

  return (
    <Card className="text-center">
      <CardHeader className="pb-2 space-y-2">
        <CardTitle className="text-sm">{label}</CardTitle>
        
        {compare && delta !== undefined && (
          <div
            className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 ${
              delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">{formatter(actual)}</div>
        
        {target !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Target: {formatter(target)}
              </span>
              <span className={isAboveTarget ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                {difference > 0 ? "+" : ""}{formatter(difference)}
              </span>
            </div>
            
            <Progress 
              value={progress || 0} 
              className={`h-2 ${isAboveTarget ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"}`}
            />
            
            <p className="text-xs text-muted-foreground">
              {progress?.toFixed(0)}% of target
              {isAboveTarget && " ✓"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

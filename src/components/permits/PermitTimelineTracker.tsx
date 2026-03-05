import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, differenceInDays, addDays } from "date-fns";

interface PermitTimelineTrackerProps {
  permitId: string;
  municipality: string;
  state: string;
  status: string;
  appliedAt?: string;
  approvedAt?: string;
}

interface TimelineStage {
  stage: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
  estimatedDays: number;
  minDays?: number;
  maxDays?: number;
  actualDays?: number;
  notes?: string;
}

export function PermitTimelineTracker({
  permitId,
  municipality,
  state,
  status,
  appliedAt,
  approvedAt
}: PermitTimelineTrackerProps) {
  const [stages, setStages] = useState<TimelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<Date | null>(null);
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    fetchTimeline();
  }, [permitId, municipality, state, status]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);

      // Fetch municipality-specific timelines
      const { data: timelines, error } = await supabase
        .from('municipality_permit_timelines' as any)
        .select('*')
        .eq('state', state)
        .in('municipality', [municipality, 'DEFAULT'])
        .order('municipality', { ascending: false }); // Prefer specific over DEFAULT

      if (error) throw error;

      // Group by stage, preferring municipality-specific data
      const stageMap = new Map<string, any>();
      timelines?.forEach((timeline: any) => {
        if (!stageMap.has(timeline.stage)) {
          stageMap.set(timeline.stage, timeline);
        }
      });

      // Define stage order and status based on permit status
      const stageOrder = ['zoning_review', 'permit_review', 'plan_approval'];
      const stageLabels = {
        zoning_review: 'Zoning Review',
        permit_review: 'Building Permit Review',
        plan_approval: 'Final Approval'
      };

      const processedStages: TimelineStage[] = stageOrder.map((stageKey, index) => {
        const timelineData = stageMap.get(stageKey);
        
        let stageStatus: 'completed' | 'in_progress' | 'pending' = 'pending';
        
        // Determine status based on permit status
        if (status === 'approved' || status === 'closed') {
          stageStatus = 'completed';
        } else if (status === 'zoning_pending' && stageKey === 'zoning_review') {
          stageStatus = 'in_progress';
        } else if ((status === 'ucc_pending' || status === 'submitted') && stageKey === 'permit_review') {
          stageStatus = 'in_progress';
        } else if ((status === 'ucc_pending' || status === 'submitted') && stageKey === 'zoning_review') {
          stageStatus = 'completed';
        } else if (status === 'submitted' && stageKey === 'plan_approval' && index === 2) {
          stageStatus = 'in_progress';
        }

        return {
          stage: stageKey,
          label: stageLabels[stageKey as keyof typeof stageLabels],
          status: stageStatus,
          estimatedDays: timelineData?.average_days || 0,
          minDays: timelineData?.min_days,
          maxDays: timelineData?.max_days,
          notes: timelineData?.notes
        };
      });

      setStages(processedStages);

      // Calculate estimated completion date
      if (appliedAt && status !== 'approved' && status !== 'closed') {
        const startDate = new Date(appliedAt);
        const totalDays = processedStages
          .filter(s => s.status !== 'completed')
          .reduce((sum, stage) => sum + stage.estimatedDays, 0);
        
        const completionDate = addDays(startDate, totalDays);
        setEstimatedCompletionDate(completionDate);
      }

      // Calculate progress
      const completedStages = processedStages.filter(s => s.status === 'completed').length;
      const inProgressStages = processedStages.filter(s => s.status === 'in_progress').length;
      const progress = ((completedStages + inProgressStages * 0.5) / processedStages.length) * 100;
      setTotalProgress(Math.round(progress));

    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stage: TimelineStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStageColor = (stage: TimelineStage) => {
    switch (stage.status) {
      case 'completed':
        return 'border-green-600 bg-green-50';
      case 'in_progress':
        return 'border-blue-600 bg-blue-50';
      default:
        return 'border-muted bg-background';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-5 w-5 animate-spin mr-2" />
            <span>Loading timeline...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Permit Timeline - {municipality}
          </CardTitle>
          {estimatedCompletionDate && (
            <div className="text-sm text-muted-foreground">
              Est. Completion: {format(estimatedCompletionDate, 'MMM dd, yyyy')}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>

          {/* Timeline Stages */}
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.stage} className="relative">
                {index < stages.length - 1 && (
                  <div 
                    className={`absolute left-3 top-12 w-0.5 h-12 ${
                      stage.status === 'completed' ? 'bg-green-600' : 'bg-muted'
                    }`}
                  />
                )}
                
                <div className={`flex items-start gap-4 p-4 border-2 rounded-lg transition-colors ${getStageColor(stage)}`}>
                  <div className="flex-shrink-0 mt-1">
                    {getStageIcon(stage)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{stage.label}</h4>
                      <Badge 
                        variant={
                          stage.status === 'completed' ? 'default' : 
                          stage.status === 'in_progress' ? 'default' : 
                          'secondary'
                        }
                      >
                        {stage.status === 'completed' ? 'Complete' :
                         stage.status === 'in_progress' ? 'In Progress' :
                         'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <Clock className="h-4 w-4" />
                              <span>
                                {stage.estimatedDays} days avg
                                {stage.minDays && stage.maxDays && (
                                  <span className="ml-1">
                                    ({stage.minDays}-{stage.maxDays})
                                  </span>
                                )}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {stage.notes || `Typical ${stage.label.toLowerCase()} time for ${municipality}`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {stage.status === 'in_progress' && appliedAt && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            Day {differenceInDays(new Date(), new Date(appliedAt))} of {stage.estimatedDays}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Footer */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground">
              Timeline estimates are based on typical {municipality} processing times. 
              Actual times may vary based on project complexity and current workload.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

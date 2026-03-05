import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { DraggableLeadCard } from "./DraggableLeadCard";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  project_type: string;
  status: string;
}

interface FunnelStage {
  name: string;
  count: number;
  status: string;
  color: string;
}

interface SalesFunnelProps {
  stages: FunnelStage[];
  selectedStage: string | null;
  onStageClick: (status: string) => void;
  leads: Lead[];
  showLeadCards?: boolean;
}

export function SalesFunnel({ stages, selectedStage, onStageClick, leads, showLeadCards = true }: SalesFunnelProps) {
  const maxCount = Math.max(...stages.map(s => s.count));
  
  // Calculate conversion rates between stages
  const getConversionRate = (currentIndex: number): number | null => {
    if (currentIndex === 0) return null;
    const previousCount = stages[currentIndex - 1].count;
    const currentCount = stages[currentIndex].count;
    if (previousCount === 0) return 0;
    return (currentCount / previousCount) * 100;
  };

  // Get leads for a specific stage
  const getLeadsForStage = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };
  
  return (
    <Card className="p-6 bg-background">
      <h3 className="text-sm font-medium text-muted-foreground mb-6">
        Sales Funnel {showLeadCards && <span className="text-xs">(Drag leads to move between stages)</span>}
      </h3>
      <div className="flex items-start gap-2">
        {stages.map((stage, index) => {
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const isSelected = selectedStage === stage.status;
          const conversionRate = getConversionRate(index);
          const dropOffRate = conversionRate !== null ? 100 - conversionRate : null;
          const stageLeads = getLeadsForStage(stage.status);

          return (
            <DroppableStage
              key={stage.status}
              stage={stage}
              index={index}
              isSelected={isSelected}
              widthPercentage={widthPercentage}
              conversionRate={conversionRate}
              dropOffRate={dropOffRate}
              stageLeads={stageLeads}
              totalStages={stages.length}
              onStageClick={onStageClick}
              showLeadCards={showLeadCards}
            />
          );
        })}
      </div>
      
      {/* Legend with conversion insights */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap gap-4 justify-center">
          {stages.map((stage) => (
            <div key={stage.status} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs text-muted-foreground">
                {stage.name}: <span className="font-medium text-foreground">{stage.count}</span>
              </span>
            </div>
          ))}
        </div>
        
        {/* Conversion summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Overall Conversion</div>
            <div className="text-lg font-bold text-foreground">
              {stages[0].count > 0 
                ? ((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(1)
                : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Total Leads</div>
            <div className="text-lg font-bold text-foreground">
              {stages.reduce((sum, s) => sum + s.count, 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Active Pipeline</div>
            <div className="text-lg font-bold text-foreground">
              {stages[0].count + stages[1].count}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shine {
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </Card>
  );
}

interface DroppableStageProps {
  stage: FunnelStage;
  index: number;
  isSelected: boolean;
  widthPercentage: number;
  conversionRate: number | null;
  dropOffRate: number | null;
  stageLeads: Lead[];
  totalStages: number;
  onStageClick: (status: string) => void;
  showLeadCards: boolean;
}

function DroppableStage({
  stage,
  index,
  isSelected,
  widthPercentage,
  conversionRate,
  dropOffRate,
  stageLeads,
  totalStages,
  onStageClick,
  showLeadCards,
}: DroppableStageProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.status,
    data: {
      status: stage.status,
      stageName: stage.name,
    },
  });

  return (
    <div className="flex-1 relative group">
      <button
        onClick={() => onStageClick(stage.status)}
        className={cn(
          "w-full transition-all duration-300 hover:scale-105 hover:shadow-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <div className="relative">
          {/* Funnel Stage */}
          <div
            ref={setNodeRef}
            className={cn(
              "relative overflow-hidden rounded-lg transition-all duration-500",
              "border-2",
              isSelected ? "border-primary" : "border-border/50 hover:border-border",
              isOver && "border-primary border-dashed bg-primary/5 scale-105"
            )}
            style={{
              minHeight: `${Math.max(120, widthPercentage * 1.2)}px`,
              background: isOver 
                ? `linear-gradient(135deg, ${stage.color}35, ${stage.color}45)`
                : `linear-gradient(135deg, ${stage.color}15, ${stage.color}25)`,
            }}
          >
            {/* Animated background */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${stage.color}25, ${stage.color}35)`,
              }}
            />
            
            {/* Header Content */}
            <div className="relative p-4 z-10 border-b border-border/30">
              <div 
                className="text-3xl font-bold mb-1 transition-all duration-300 group-hover:scale-110"
                style={{ color: stage.color }}
              >
                {stage.count}
              </div>
              <div className="text-xs font-medium text-foreground/80 text-center leading-tight">
                {stage.name}
              </div>
            </div>

            {/* Lead Cards */}
            {showLeadCards && stageLeads.length > 0 && (
              <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                {stageLeads.slice(0, 3).map((lead) => (
                  <DraggableLeadCard key={lead.id} lead={lead} stageColor={stage.color} />
                ))}
                {stageLeads.length > 3 && (
                  <div className="text-xs text-center text-muted-foreground py-2">
                    +{stageLeads.length - 3} more
                  </div>
                )}
              </div>
            )}

            {/* Drop overlay */}
            {isOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm z-20 pointer-events-none">
                <div className="text-sm font-medium" style={{ color: stage.color }}>
                  Drop to move here
                </div>
              </div>
            )}
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                style={{
                  transform: "translateX(-100%)",
                  animation: "shine 1.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>
          
          {/* Arrow connector with conversion rate */}
          {index < totalStages - 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 flex flex-col items-center">
              <div 
                className="w-0 h-0 border-t-[12px] border-b-[12px] border-l-[12px] border-transparent transition-colors duration-300"
                style={{ 
                  borderLeftColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--border))",
                }}
              />
              {conversionRate !== null && (
                <div className="absolute -bottom-8 whitespace-nowrap">
                  <div className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm border",
                    conversionRate >= 50 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" 
                      : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                  )}>
                    {conversionRate >= 50 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {conversionRate.toFixed(1)}%
                  </div>
                  {dropOffRate !== null && dropOffRate > 0 && (
                    <div className="text-[9px] text-muted-foreground text-center mt-0.5">
                      {dropOffRate.toFixed(1)}% drop
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

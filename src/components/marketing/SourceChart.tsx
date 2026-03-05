import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SourceBreakdown } from "@/services/marketingAnalyticsService";

interface SourceChartProps {
  data: SourceBreakdown[];
  onSourceClick?: (source: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  google: "hsl(var(--chart-1))",
  facebook: "hsl(var(--chart-2))",
  instagram: "hsl(var(--chart-3))",
  referral: "hsl(var(--chart-4))",
  other: "hsl(var(--chart-5))",
};

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
  referral: "Referral",
  other: "Other",
};

export function SourceChart({ data, onSourceClick }: SourceChartProps) {
  const chartData = data.map(item => ({
    name: SOURCE_LABELS[item.source] || item.source,
    value: item.count,
    source: item.source,
    closeRate: item.closeRate,
  }));

  const handleClick = (entry: any) => {
    if (onSourceClick && entry?.source) {
      onSourceClick(entry.source);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by Source</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                onClick={(_, index) => handleClick(chartData[index])}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={SOURCE_COLORS[entry.source] || SOURCE_COLORS.other}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value} leads
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.closeRate}% close rate
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

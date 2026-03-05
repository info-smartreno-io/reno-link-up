import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target } from "lucide-react";

type GoalPeriod = 'monthly' | 'quarterly' | 'yearly';

type KpiGoals = {
  set_rate: number;
  close_rate: number;
  avg_ticket: number;
  gross_margin: number;
};

type KpiGoalRecord = {
  id?: string;
  period: GoalPeriod;
  year: number;
  month?: number;
  quarter?: number;
  goals: KpiGoals;
  created_at?: string;
  updated_at?: string;
};

interface KpiGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalsUpdated: () => void;
}

export function KpiGoalsDialog({ open, onOpenChange, onGoalsUpdated }: KpiGoalsDialogProps) {
  const [period, setPeriod] = React.useState<GoalPeriod>('monthly');
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = React.useState(Math.floor(new Date().getMonth() / 3) + 1);
  
  const [goals, setGoals] = React.useState<KpiGoals>({
    set_rate: 40,
    close_rate: 30,
    avg_ticket: 20000,
    gross_margin: 45,
  });
  
  const [loading, setLoading] = React.useState(false);
  const [existingId, setExistingId] = React.useState<string | null>(null);

  // Load existing goals when dialog opens or period changes
  React.useEffect(() => {
    if (!open) return;
    
    const loadGoals = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('kpi_goals')
          .select('*')
          .eq('period', period)
          .eq('year', year);

        if (period === 'monthly') {
          query = query.eq('month', month);
        } else if (period === 'quarterly') {
          query = query.eq('quarter', quarter);
        }

        const { data, error } = await query.single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading goals:', error);
          return;
        }

        if (data) {
          setExistingId(data.id);
          setGoals(data.goals as KpiGoals);
        } else {
          setExistingId(null);
          // Reset to defaults
          setGoals({
            set_rate: 40,
            close_rate: 30,
            avg_ticket: 20000,
            gross_margin: 45,
          });
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [open, period, year, month, quarter]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const record: any = {
        period,
        year,
        goals,
      };

      if (period === 'monthly') {
        record.month = month;
      } else if (period === 'quarterly') {
        record.quarter = quarter;
      }

      if (existingId) {
        // Update existing
        const { error } = await supabase
          .from('kpi_goals')
          .update(record)
          .eq('id', existingId);

        if (error) throw error;
        toast.success('Goals updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('kpi_goals')
          .insert([record]);

        if (error) throw error;
        toast.success('Goals created successfully');
      }

      onGoalsUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving goals:', error);
      toast.error(error.message || 'Failed to save goals');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    if (period === 'monthly') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[month - 1]} ${year}`;
    } else if (period === 'quarterly') {
      return `Q${quarter} ${year}`;
    } else {
      return `${year}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Set KPI Goals
          </DialogTitle>
          <DialogDescription>
            Define your target metrics for tracking performance against goals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Period Type</Label>
              <Select value={period} onValueChange={(v: GoalPeriod) => setPeriod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>

            {period === 'monthly' && (
              <div>
                <Label>Month</Label>
                <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(2000, m - 1).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {period === 'quarterly' && (
              <div>
                <Label>Quarter</Label>
                <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                    <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-sm font-medium">Goals for: {getPeriodLabel()}</p>
          </div>

          {/* Goals Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setRate">Set Rate Target (%)</Label>
              <Input
                id="setRate"
                type="number"
                step="0.1"
                value={goals.set_rate}
                onChange={(e) => setGoals({ ...goals, set_rate: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">Percentage of leads that book appointments</p>
            </div>

            <div>
              <Label htmlFor="closeRate">Close Rate Target (%)</Label>
              <Input
                id="closeRate"
                type="number"
                step="0.1"
                value={goals.close_rate}
                onChange={(e) => setGoals({ ...goals, close_rate: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">Percentage of appointments that convert</p>
            </div>

            <div>
              <Label htmlFor="avgTicket">Average Ticket Target ($)</Label>
              <Input
                id="avgTicket"
                type="number"
                step="100"
                value={goals.avg_ticket}
                onChange={(e) => setGoals({ ...goals, avg_ticket: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">Target average project value</p>
            </div>

            <div>
              <Label htmlFor="grossMargin">Gross Margin Target (%)</Label>
              <Input
                id="grossMargin"
                type="number"
                step="0.1"
                value={goals.gross_margin}
                onChange={(e) => setGoals({ ...goals, gross_margin: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">Target profit margin percentage</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : existingId ? 'Update Goals' : 'Create Goals'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

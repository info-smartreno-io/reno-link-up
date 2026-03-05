import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface PCBudgetPanelProps {
  projectId: string;
  isReadOnly?: boolean;
}

const CATEGORIES = [
  "Framing",
  "HVAC",
  "Electrical",
  "Plumbing",
  "Roofing",
  "Exterior",
  "Interior",
  "Materials",
  "Labor",
  "Permits",
  "Contingency",
];

export function PCBudgetPanel({ projectId, isReadOnly = false }: PCBudgetPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["pc-budget-categories", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pc_budget_categories")
        .select("*")
        .eq("project_id", projectId)
        .order("category");

      if (error) throw error;
      return data || [];
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pc_budget_categories").insert({
        project_id: projectId,
        category: newCategory,
        budget_amount: parseFloat(newBudget) || 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pc-budget-categories", projectId] });
      toast({ title: "Category added" });
      setDialogOpen(false);
      setNewCategory("");
      setNewBudget("");
    },
    onError: () => {
      toast({ title: "Failed to add category", variant: "destructive" });
    },
  });

  const updateAwardedMutation = useMutation({
    mutationFn: async ({ categoryId, amount }: { categoryId: string; amount: number }) => {
      const { error } = await supabase
        .from("pc_budget_categories")
        .update({ awarded_amount: amount })
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pc-budget-categories", projectId] });
      toast({ title: "Budget updated" });
    },
  });

  const totalBudget = categories.reduce((sum, c) => sum + (c.budget_amount || 0), 0);
  const totalAwarded = categories.reduce((sum, c) => sum + (c.awarded_amount || 0), 0);
  const totalVariance = totalAwarded - totalBudget;
  const hasOverages = categories.some(c => (c.variance || 0) > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Finalization</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={hasOverages ? "border-amber-500/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Budget Finalization
              {hasOverages && <AlertTriangle className="h-4 w-4 text-amber-600" />}
            </CardTitle>
            <CardDescription>
              Track budget vs awarded amounts by category
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Budget Category</DialogTitle>
                  <DialogDescription>
                    Add a new budget line item
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Select category...</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Amount *</Label>
                    <Input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <Button 
                    onClick={() => addCategoryMutation.mutate()} 
                    disabled={!newCategory || !newBudget || addCategoryMutation.isPending}
                    className="w-full"
                  >
                    {addCategoryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : "Add Category"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground block text-xs">Budget</span>
            <span className="font-bold text-lg">${totalBudget.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground block text-xs">Awarded</span>
            <span className="font-bold text-lg">${totalAwarded.toLocaleString()}</span>
          </div>
          <div className={`p-3 rounded-lg ${totalVariance > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
            <span className="text-muted-foreground block text-xs">Variance</span>
            <span className={`font-bold text-lg flex items-center gap-1 ${totalVariance > 0 ? "text-red-600" : "text-green-600"}`}>
              {totalVariance > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              ${Math.abs(totalVariance).toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No budget categories created yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Awarded</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => {
                const variance = cat.variance || 0;
                return (
                  <TableRow key={cat.id} className={variance > 0 ? "bg-red-500/5" : ""}>
                    <TableCell className="font-medium">
                      {cat.category}
                      {cat.flagged && (
                        <Badge variant="destructive" className="ml-2 text-xs">Flagged</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ${cat.budget_amount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isReadOnly ? (
                        <Input
                          type="number"
                          value={cat.awarded_amount || ""}
                          onChange={(e) => {
                            updateAwardedMutation.mutate({
                              categoryId: cat.id,
                              amount: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-24 text-right h-8 inline-block"
                        />
                      ) : (
                        `$${cat.awarded_amount?.toLocaleString() || 0}`
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${variance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {variance > 0 ? "+" : ""}${variance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldCheck, Clock, AlertCircle, DollarSign, Building2, Droplet, Zap, Thermometer, Home, Plug, Wrench, LucideIcon } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

interface WarrantyPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  description: string;
  default_duration_years: number;
}

interface WarrantyPlanItem {
  id: string;
  item_category: string;
  item_name: string;
  coverage_years: number;
  coverage_description: string;
  max_claim_amount: number | null;
  deductible: number | null;
}

interface WarrantyExclusion {
  id: string;
  exclusion_category: string;
  exclusion_description: string;
}

interface ProjectWarranty {
  id: string;
  project_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  notes: string | null;
}

export const WarrantyCoverageChecker = () => {
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState<(ProjectWarranty & { plan: WarrantyPlan })[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<string | null>(null);
  const [planItems, setPlanItems] = useState<WarrantyPlanItem[]>([]);
  const [exclusions, setExclusions] = useState<WarrantyExclusion[]>([]);

  useEffect(() => {
    fetchWarranties();
  }, []);

  useEffect(() => {
    if (selectedWarranty) {
      const warranty = warranties.find(w => w.id === selectedWarranty);
      if (warranty) {
        fetchPlanDetails(warranty.plan_id);
      }
    }
  }, [selectedWarranty, warranties]);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('project_warranties' as any)
        .select(`
          *,
          plan:warranty_plans(*)
        `)
        .eq('homeowner_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWarranties((data as any) || []);
      if (data && data.length > 0) {
        setSelectedWarranty((data as any)[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching warranties:', error);
      toast.error('Failed to load warranty coverage');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetails = async (planId: string) => {
    try {
      const [itemsRes, exclusionsRes] = await Promise.all([
        supabase
          .from('warranty_plan_items' as any)
          .select('*')
          .eq('plan_id', planId)
          .order('item_category'),
        supabase
          .from('warranty_exclusions' as any)
          .select('*')
          .eq('plan_id', planId)
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (exclusionsRes.error) throw exclusionsRes.error;

      setPlanItems((itemsRes.data as any) || []);
      setExclusions((exclusionsRes.data as any) || []);
    } catch (error: any) {
      console.error('Error fetching plan details:', error);
      toast.error('Failed to load coverage details');
    }
  };

  const calculateCoverageProgress = (warranty: ProjectWarranty) => {
    const startDate = parseISO(warranty.start_date);
    const endDate = parseISO(warranty.end_date);
    const today = new Date();
    
    const totalDays = differenceInDays(endDate, startDate);
    const daysElapsed = differenceInDays(today, startDate);
    const daysRemaining = differenceInDays(endDate, today);
    
    const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
    
    return { progress, daysRemaining, totalDays };
  };

  const getItemExpirationDate = (warranty: ProjectWarranty, item: WarrantyPlanItem) => {
    const startDate = parseISO(warranty.start_date);
    const expirationDate = new Date(startDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + item.coverage_years);
    return expirationDate;
  };

  const getCategoryIcon = (category: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      structural: Building2,
      plumbing: Droplet,
      electrical: Zap,
      hvac: Thermometer,
      roofing: Home,
      appliances: Plug
    };
    return icons[category] || Wrench;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      structural: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      plumbing: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
      electrical: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      hvac: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      roofing: 'bg-green-500/10 text-green-700 dark:text-green-400',
      appliances: 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
    };
    return colors[category] || 'bg-muted';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const groupItemsByCategory = (items: WarrantyPlanItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.item_category]) {
        acc[item.item_category] = [];
      }
      acc[item.item_category].push(item);
      return acc;
    }, {} as Record<string, WarrantyPlanItem[]>);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading warranty coverage...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (warranties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <ShieldCheck className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Active Warranties</h3>
          <p className="text-sm text-muted-foreground text-center">
            You don't have any active warranty coverage at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentWarranty = warranties.find(w => w.id === selectedWarranty);
  if (!currentWarranty) return null;

  const { progress, daysRemaining, totalDays } = calculateCoverageProgress(currentWarranty);
  const groupedItems = groupItemsByCategory(planItems);

  return (
    <div className="space-y-6">
      {/* Warranty Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                {currentWarranty.plan.plan_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentWarranty.plan.description}
              </p>
            </div>
            <Badge variant={currentWarranty.plan.plan_type === 'premium' ? 'default' : 'secondary'}>
              {currentWarranty.plan.plan_type.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coverage Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Coverage Duration</span>
              <span className="text-sm text-muted-foreground">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{format(parseISO(currentWarranty.start_date), 'MMM d, yyyy')}</span>
              <span>{format(parseISO(currentWarranty.end_date), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{planItems.length}</div>
              <div className="text-xs text-muted-foreground">Covered Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentWarranty.plan.default_duration_years}
              </div>
              <div className="text-xs text-muted-foreground">Years Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{exclusions.length}</div>
              <div className="text-xs text-muted-foreground">Exclusions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Details */}
      <Card>
        <CardHeader>
          <CardTitle>What's Covered</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(groupedItems).map(([category, items]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = getCategoryIcon(category);
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                    <span className="capitalize font-semibold">{category}</span>
                    <Badge variant="outline" className="ml-2">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {items.map((item) => {
                      const expirationDate = getItemExpirationDate(currentWarranty, item);
                      const isExpired = expirationDate < new Date();
                      
                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-lg border ${getCategoryColor(category)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{item.item_name}</h4>
                            <Badge variant={isExpired ? 'destructive' : 'default'}>
                              {isExpired ? 'Expired' : `${item.coverage_years} years`}
                            </Badge>
                          </div>
                          <p className="text-sm mb-3">{item.coverage_description}</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                Max: {formatCurrency(item.max_claim_amount)}
                              </span>
                            </div>
                            {item.deductible && item.deductible > 0 && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span>
                                  Deductible: {formatCurrency(item.deductible)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 col-span-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                Expires: {format(expirationDate, 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Exclusions */}
      {exclusions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              What's Not Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exclusions.map((exclusion) => (
                <div
                  key={exclusion.id}
                  className="p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                >
                  <h4 className="font-semibold capitalize mb-1">
                    {exclusion.exclusion_category.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {exclusion.exclusion_description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {currentWarranty.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{currentWarranty.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Collections Page - Notion-style grouped tables with sorting
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter, Wallet } from "lucide-react";
import { CollectionsTable, CollectionItem } from "@/components/contractor/CollectionsTable";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MobileScrollTabs } from "@/components/ui/mobile-scroll-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoProjects, getDemoInvoices } from "@/utils/demoContractorData";

type ViewFilter = "overview" | "this-week" | "past-2-weeks" | "uncollected" | "schedules";
type GroupByOption = "pm" | "customer" | "status";

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isDemoMode } = useDemoMode();
  
  const viewParam = searchParams.get("view") as ViewFilter | null;
  const [viewFilter, setViewFilter] = useState<ViewFilter>(viewParam || "overview");
  const [groupBy, setGroupBy] = useState<GroupByOption>("pm");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        const projects = getDemoProjects();
        const invoices = getDemoInvoices();
        return invoices.map((inv, idx): CollectionItem => ({
          id: inv.id,
          description: `${inv.project_name} - ${inv.invoice_number}`,
          milestone_name: inv.status === "paid" ? "Final Payment" : "Progress Payment",
          status: inv.status === "paid" ? "paid" : "pending",
          due_date: inv.due_date,
          paid_at: inv.paid_date,
          payment_amount: inv.amount,
          scheduled_balance: inv.amount,
          pm_id: null,
          pm_name: ["John Smith", "Sarah Chen", "Maria Garcia"][idx % 3],
          customer_name: inv.client_name,
          project_id: inv.project_id,
          is_open: inv.status !== "paid",
        }));
      }
      const { data, error } = await supabase
        .from("payment_schedules")
        .select(`
          id,
          milestone_name,
          amount,
          due_date,
          paid_at,
          status,
          contract_id,
          contracts!inner (
            id,
            project_id,
            contract_value,
            projects (
              id,
              project_name,
              project_type,
              project_manager_id
            )
          )
        `)
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Fetch PM profiles separately
      const pmIds = [...new Set((data || [])
        .map(item => (item.contracts as any)?.projects?.project_manager_id)
        .filter(Boolean))];
      
      let pmMap: Record<string, string> = {};
      if (pmIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", pmIds);
        
        pmMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name || "Unknown";
          return acc;
        }, {} as Record<string, string>);
      }

      return (data || []).map((item): CollectionItem => {
        const contract = item.contracts as any;
        const project = contract?.projects;
        const pmId = project?.project_manager_id;

        return {
          id: item.id,
          description: project?.project_name
            ? `${project.project_name} ${item.milestone_name || ""}`.trim()
            : item.milestone_name || "Untitled",
          milestone_name: item.milestone_name,
          status: item.status || "pending",
          due_date: item.due_date,
          paid_at: item.paid_at,
          payment_amount: item.amount || 0,
          scheduled_balance: item.amount || 0,
          pm_id: pmId || null,
          pm_name: pmId ? pmMap[pmId] || "Unassigned" : "Unassigned",
          customer_name: project?.project_name || "Unknown",
          project_id: project?.id || null,
          is_open: item.status !== "paid",
        };
      });
    },
  });

  const filteredCollections = collections.filter((item) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !item.description.toLowerCase().includes(search) &&
        !item.customer_name.toLowerCase().includes(search) &&
        !item.pm_name.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // View filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (viewFilter) {
      case "this-week": {
        if (!item.paid_at) return false;
        const paidDate = new Date(item.paid_at);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return paidDate >= weekAgo;
      }
      case "past-2-weeks": {
        if (!item.paid_at) return false;
        const paidDate = new Date(item.paid_at);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return paidDate >= twoWeeksAgo;
      }
      case "uncollected":
        return !item.paid_at;
      case "schedules":
      case "overview":
      default:
        return true;
    }
  });

  const handleViewChange = (view: string) => {
    const viewValue = view as ViewFilter;
    setViewFilter(viewValue);
    if (viewValue === "overview") {
      searchParams.delete("view");
    } else {
      searchParams.set("view", viewValue);
    }
    setSearchParams(searchParams);
  };

  const handleRowClick = (item: CollectionItem) => {
    if (item.project_id) {
      navigate(`/contractor/projects/${item.project_id}`);
    }
  };

  const viewOptions = [
    { value: "overview", label: "Overview" },
    { value: "this-week", label: "This Week" },
    { value: "past-2-weeks", label: "Past 2 Weeks" },
    { value: "uncollected", label: "Uncollected" },
    { value: "schedules", label: "Schedules" },
  ];

  // Calculate stats
  const totalOutstanding = filteredCollections
    .filter((c) => !c.paid_at)
    .reduce((sum, c) => sum + c.payment_amount, 0);

  const collectedThisWeek = collections
    .filter((c) => {
      if (!c.paid_at) return false;
      const paidDate = new Date(c.paid_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return paidDate >= weekAgo;
    })
    .reduce((sum, c) => sum + c.payment_amount, 0);

  const pastDue = filteredCollections
    .filter((c) => {
      if (c.paid_at || !c.due_date) return false;
      return new Date(c.due_date) < new Date();
    })
    .reduce((sum, c) => sum + c.payment_amount, 0);

  const collectionRate = collections.length > 0
    ? Math.round((collections.filter((c) => c.paid_at).length / collections.length) * 100)
    : 0;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header - Stacks on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Collections
        </h1>
        <Button className="w-full sm:w-auto min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* View Tabs - Scrollable on mobile */}
      {isMobile ? (
        <MobileScrollTabs
          tabs={viewOptions}
          value={viewFilter}
          onValueChange={handleViewChange}
        />
      ) : (
        <div className="flex items-center gap-2 border-b pb-2">
          {viewOptions.map((option) => (
            <Button
              key={option.value}
              variant={viewFilter === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleViewChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {/* Filters Row - Stacks on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pm">Group by PM</SelectItem>
            <SelectItem value="customer">Group by Customer</SelectItem>
            <SelectItem value="status">Group by Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats - 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">Outstanding</div>
          <div className="text-lg md:text-2xl font-bold truncate">
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">This Week</div>
          <div className="text-lg md:text-2xl font-bold text-green-600 truncate">
            {formatCurrency(collectedThisWeek)}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">Past Due</div>
          <div className="text-lg md:text-2xl font-bold text-red-600 truncate">
            {formatCurrency(pastDue)}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">Rate</div>
          <div className="text-lg md:text-2xl font-bold">
            {collectionRate}%
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading collections...</div>
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No collections found matching your criteria.
        </div>
      ) : (
        <CollectionsTable
          data={filteredCollections}
          groupBy={groupBy}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
}

// Sales Pipeline Page - Notion-style grouped tables
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NotionStyleTable, SalesPipelineItem } from "@/components/contractor/NotionStyleTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, ChevronDown, LayoutGrid, List, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoSalesPipeline } from "@/utils/demoContractorData";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";

type GroupByOption = "sales_rep" | "status" | "category";
type ViewMode = "table" | "board" | "calendar";

export default function SalesPipeline() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByOption>("sales_rep");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { isDemoMode } = useDemoMode();

  // Fetch leads/estimates data
  const { data: pipelineData = [], isLoading } = useQuery({
    queryKey: ["sales-pipeline", isDemoMode],
    queryFn: async () => {
      // In demo mode, return demo data
      if (isDemoMode) {
        return getDemoSalesPipeline() as SalesPipelineItem[];
      }

      // Fetch estimates with lead info
      const { data: estimates, error } = await supabase
        .from("estimates")
        .select(`
          id,
          total_cost,
          status,
          created_at,
          project_type,
          lead_id,
          assigned_to,
          leads!estimates_lead_id_fkey (
            id,
            full_name,
            city,
            lead_source,
            lead_quality,
            probability
          ),
          profiles!estimates_assigned_to_fkey (
            id,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform to pipeline items
      return (estimates || []).map((est: any): SalesPipelineItem => ({
        id: est.id,
        customer_name: est.leads?.full_name || "Unknown",
        town: est.leads?.city || "N/A",
        amount: est.total_cost || 0,
        category: est.project_type || "Other",
        lead_quality: est.leads?.lead_quality || "cold",
        probability: est.leads?.probability || 0,
        status: est.status || "draft",
        sales_rep: est.profiles?.full_name || "Unassigned",
        sales_rep_id: est.assigned_to || "unassigned",
        estimate_date: est.created_at,
      }));
    },
  });

  // Filter data
  const filteredData = pipelineData.filter((item) => {
    const matchesSearch = 
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.town.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const totalItems = filteredData.length;

  const handleRowClick = (item: SalesPipelineItem) => {
    navigate(`/contractor/leads/${item.id}`);
  };

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales Pipeline</h1>
            <p className="text-muted-foreground">
              {totalItems} opportunities · ${totalAmount.toLocaleString()} total value
            </p>
          </div>
          <Button onClick={() => navigate("/contractor/leads/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers, towns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="proposal_sent">Proposal Sent</TabsTrigger>
              <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
              <TabsTrigger value="won">Won</TabsTrigger>
              <TabsTrigger value="lost">Lost</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Group By */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Group by: {groupBy.replace("_", " ")}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setGroupBy("sales_rep")}>
                Sales Rep
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("status")}>
                Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("category")}>
                Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("calendar")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No opportunities found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/contractor/leads/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first lead
            </Button>
          </div>
        ) : (
          <NotionStyleTable
            data={filteredData}
            groupBy={groupBy}
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </ContractorLayout>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoVendors } from "@/utils/demoContractorData";

interface VendorPerformance {
  id: string;
  company_name: string;
  total_pos: number;
  total_spend: number;
  on_time_deliveries: number;
  late_deliveries: number;
  avg_response_time: number;
  on_time_percentage: number;
  rating: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function VendorPerformance() {
  const [vendors, setVendors] = useState<VendorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    fetchPerformanceData();
  }, [timeframe, selectedVendor, isDemoMode]);

  const fetchPerformanceData = async () => {
    if (isDemoMode) {
      const demoVendors = getDemoVendors();
      const demoPerformance: VendorPerformance[] = demoVendors.map((v, idx) => ({
        id: v.id,
        company_name: v.company_name,
        total_pos: 8 + idx * 3,
        total_spend: 15000 + idx * 8500,
        on_time_deliveries: 6 + idx * 2,
        late_deliveries: idx,
        avg_response_time: 2.5 - idx * 0.3,
        on_time_percentage: 85 + idx * 3,
        rating: v.rating,
      }));
      setVendors(demoPerformance);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));
      
      // Fetch vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, company_name, rating')
        .eq('status', 'active');

      if (vendorError) throw vendorError;

      // Fetch purchase orders for each vendor
      const performanceData: VendorPerformance[] = await Promise.all(
        (vendorData || []).map(async (vendor) => {
          // Get purchase orders
          const { data: pos, error: poError } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('vendor_id', vendor.id)
            .gte('order_date', startDate.toISOString());

          if (poError) throw poError;

          const totalPOs = pos?.length || 0;
          const totalSpend = pos?.reduce((sum, po) => sum + (parseFloat(po.total?.toString() || '0')), 0) || 0;
          
          // Calculate on-time deliveries
          const deliveredPOs = pos?.filter(po => po.actual_delivery) || [];
          const onTimeDeliveries = deliveredPOs.filter(po => {
            if (!po.expected_delivery || !po.actual_delivery) return false;
            return new Date(po.actual_delivery) <= new Date(po.expected_delivery);
          }).length;
          
          const lateDeliveries = deliveredPOs.length - onTimeDeliveries;
          const onTimePercentage = deliveredPOs.length > 0 
            ? (onTimeDeliveries / deliveredPOs.length) * 100 
            : 0;

          // For now, set avg response time to 0 since vendor_communications may not have data yet
          const avgResponseTime = 0;

          return {
            id: vendor.id,
            company_name: vendor.company_name,
            total_pos: totalPOs,
            total_spend: totalSpend,
            on_time_deliveries: onTimeDeliveries,
            late_deliveries: lateDeliveries,
            avg_response_time: avgResponseTime,
            on_time_percentage: onTimePercentage,
            rating: vendor.rating || 0,
          };
        })
      );

      setVendors(performanceData.sort((a, b) => b.total_spend - a.total_spend));
    } catch (error: any) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = selectedVendor === "all" 
    ? vendors 
    : vendors.filter(v => v.id === selectedVendor);

  const totalSpend = filteredVendors.reduce((sum, v) => sum + v.total_spend, 0);
  const totalPOs = filteredVendors.reduce((sum, v) => sum + v.total_pos, 0);
  const avgOnTimeRate = filteredVendors.length > 0
    ? filteredVendors.reduce((sum, v) => sum + v.on_time_percentage, 0) / filteredVendors.length
    : 0;
  const avgResponseTime = filteredVendors.length > 0
    ? filteredVendors.reduce((sum, v) => sum + v.avg_response_time, 0) / filteredVendors.length
    : 0;

  // Chart data
  const spendByVendor = filteredVendors.slice(0, 10).map(v => ({
    name: v.company_name.length > 15 ? v.company_name.substring(0, 15) + '...' : v.company_name,
    spend: v.total_spend,
  }));

  const onTimeData = filteredVendors.slice(0, 8).map(v => ({
    name: v.company_name.length > 12 ? v.company_name.substring(0, 12) + '...' : v.company_name,
    onTime: v.on_time_percentage,
  }));

  const deliveryStatusData = [
    { name: 'On Time', value: filteredVendors.reduce((sum, v) => sum + v.on_time_deliveries, 0) },
    { name: 'Late', value: filteredVendors.reduce((sum, v) => sum + v.late_deliveries, 0) },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <ContractorLayout>
        <div className="p-6">
          <div className="text-center py-12">Loading performance data...</div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/contractor/vendors')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Vendor Performance</h1>
              </div>
              <p className="text-muted-foreground">
                Track vendor metrics and delivery performance
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Timeframe</label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="60">Last 60 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                      <SelectItem value="180">Last 6 Months</SelectItem>
                      <SelectItem value="365">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Vendor</label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Total Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {totalPOs} purchase orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  On-Time Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {avgOnTimeRate.toFixed(1)}%
                  {avgOnTimeRate >= 90 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average across vendors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgResponseTime.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Time to respond to inquiries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Total POs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPOs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Purchase orders issued
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Spend by Vendor */}
            <Card>
              <CardHeader>
                <CardTitle>Spend by Vendor</CardTitle>
                <CardDescription>Top vendors by total purchase amount</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendByVendor}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value: any) => `$${parseFloat(value).toLocaleString()}`}
                    />
                    <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* On-Time Delivery Rate */}
            <Card>
              <CardHeader>
                <CardTitle>On-Time Delivery Rate</CardTitle>
                <CardDescription>Percentage of deliveries on time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={onTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: 'hsl(var(--foreground))' }}
                      label={{ value: '%', position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value: any) => `${parseFloat(value).toFixed(1)}%`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="onTime" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Delivery Status Distribution */}
            {deliveryStatusData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Status</CardTitle>
                  <CardDescription>Distribution of on-time vs late deliveries</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deliveryStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {deliveryStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Vendor Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance Details</CardTitle>
              <CardDescription>Detailed metrics for each vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Total POs</TableHead>
                      <TableHead className="text-right">Total Spend</TableHead>
                      <TableHead className="text-right">On-Time %</TableHead>
                      <TableHead className="text-right">Avg Response</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No performance data available for the selected timeframe
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.company_name}</TableCell>
                          <TableCell className="text-right">{vendor.total_pos}</TableCell>
                          <TableCell className="text-right">
                            ${vendor.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {vendor.on_time_percentage.toFixed(1)}%
                              {vendor.on_time_percentage >= 90 ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {vendor.avg_response_time > 0 ? `${vendor.avg_response_time.toFixed(1)}h` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={vendor.rating >= 4 ? "default" : "secondary"}>
                              {vendor.rating.toFixed(1)} ⭐
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContractorLayout>
  );
}

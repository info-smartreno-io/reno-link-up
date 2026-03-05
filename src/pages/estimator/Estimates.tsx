import { useState, useEffect } from "react";
import CreateEstimateForm from "@/components/forms/CreateEstimateForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, Plus, FileText, Clock, CheckCircle2, XCircle, DollarSign, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SendToBidRoomDialog } from "@/components/estimator/SendToBidRoomDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  project_name: string;
  amount: number;
  status: string;
  created_at: string;
  valid_until: string | null;
}

const statusConfig: Record<string, { color: string; icon: any }> = {
  draft: { color: "text-gray-600", icon: FileText },
  pending: { color: "text-yellow-600", icon: Clock },
  approved: { color: "text-green-600", icon: CheckCircle2 },
  rejected: { color: "text-red-600", icon: XCircle },
};

export default function EstimatorEstimates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, totalValue: 0 });
  const [bidRoomDialogOpen, setBidRoomDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    fetchEstimates();

    // Set up real-time subscription
    const channel = supabase
      .channel('estimates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estimates'
        },
        () => {
          fetchEstimates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEstimates = async () => {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const estimatesData = data || [];
      setEstimates(estimatesData);
      
      // Calculate stats
      const pending = estimatesData.filter(e => e.status === 'pending').length;
      const approved = estimatesData.filter(e => e.status === 'approved').length;
      const totalValue = estimatesData.reduce((sum, e) => sum + Number(e.amount), 0);
      
      setStats({ pending, approved, totalValue });
    } catch (error: any) {
      console.error('Error fetching estimates:', error);
      toast({
        title: "Error",
        description: "Failed to load estimates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEstimates = estimates.filter(estimate =>
    estimate.estimate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/estimator/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Estimates</h1>
            <p className="text-muted-foreground">Manage and track all project estimates</p>
          </div>
          <CreateEstimateForm onSuccess={fetchEstimates} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl p-2 border bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl p-2 border bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats.approved}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl p-2 border bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold">${(stats.totalValue / 1000000).toFixed(1)}M</div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search estimates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Estimates ({filteredEstimates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEstimates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No estimates found</p>
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map((estimate) => {
                  const StatusIcon = statusConfig[estimate.status]?.icon || FileText;
                  return (
                    <TableRow key={estimate.id}>
                      <TableCell className="font-medium">{estimate.estimate_number}</TableCell>
                      <TableCell>{estimate.client_name}</TableCell>
                      <TableCell>{estimate.project_name}</TableCell>
                      <TableCell className="font-semibold">${Number(estimate.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <StatusIcon className={`h-3 w-3 ${statusConfig[estimate.status]?.color || 'text-gray-600'}`} />
                          {estimate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(estimate.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {estimate.valid_until ? new Date(estimate.valid_until).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedEstimate(estimate);
                              setBidRoomDialogOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send to Bid Room
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/estimator/prepare-estimate/${estimate.id}`)}>
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </main>

      {selectedEstimate && (
        <SendToBidRoomDialog
          open={bidRoomDialogOpen}
          onOpenChange={setBidRoomDialogOpen}
          projectId={selectedEstimate.id}
          projectName={selectedEstimate.project_name}
          projectType={selectedEstimate.project_name}
          location="TBD"
          estimatedBudget={Number(selectedEstimate.amount)}
          onSuccess={fetchEstimates}
        />
      )}
    </div>
  );
}
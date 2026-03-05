import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, DollarSign, FileText, Circle, Star, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoBidOpportunities, getDemoProjects } from "@/utils/demoContractorData";

interface ContractorBid {
  id: string;
  project_id: string | null;
  bid_amount: number;
  status: string;
  notes: string | null;
  submitted_at: string;
  updated_at: string;
  created_at: string;
}

interface BidWithProject extends ContractorBid {
  project_name: string;
  last_update: string;
}

export default function ContractorBids() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<BidWithProject[]>([]);
  const [filteredBids, setFilteredBids] = useState<BidWithProject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBid, setSelectedBid] = useState<BidWithProject | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    const fetchBids = async () => {
      // Demo mode: create sample bids from demo data
      if (isDemoMode) {
        const demoProjects = getDemoProjects();
        const demoBids: BidWithProject[] = demoProjects.slice(0, 6).map((p, idx) => ({
          id: `demo-bid-${idx + 1}`,
          project_id: p.id,
          bid_amount: p.amount,
          status: ['submitted', 'under_review', 'shortlisted', 'awarded', 'pending', 'declined'][idx % 6],
          notes: `Bid for ${p.name}`,
          submitted_at: new Date(Date.now() - (idx * 86400000 * 3)).toISOString(),
          updated_at: new Date(Date.now() - (idx * 86400000)).toISOString(),
          created_at: new Date(Date.now() - (idx * 86400000 * 3)).toISOString(),
          project_name: p.name,
          last_update: new Date(Date.now() - (idx * 86400000)).toISOString(),
        }));
        setBids(demoBids);
        setFilteredBids(demoBids);
        setLoading(false);
        return;
      }
      
      if (!user) return;

      try {
        const { data: bidsData, error: bidsError } = await supabase
          .from('contractor_bids')
          .select('*')
          .eq('contractor_id', user.id)
          .order('submitted_at', { ascending: false });

        if (bidsError) throw bidsError;

        // Fetch project names
        const { data: projectsData, error: projectsError } = await supabase
          .from('contractor_projects')
          .select('id, project_name')
          .eq('contractor_id', user.id);

        if (projectsError) throw projectsError;

        // Combine bids with project names
        const bidsWithProjects: BidWithProject[] = (bidsData || []).map(bid => {
          const project = projectsData?.find(p => p.id === bid.project_id);
          return {
            ...bid,
            project_name: project?.project_name || 'Unknown Project',
            last_update: bid.updated_at
          };
        });

        setBids(bidsWithProjects);
        setFilteredBids(bidsWithProjects);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bids:", error);
        toast({
          title: "Error",
          description: "Failed to load bids.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchBids();
  }, [user, toast, isDemoMode]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = bids.filter(b =>
        b.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBids(filtered);
    } else {
      setFilteredBids(bids);
    }
  }, [searchTerm, bids]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: JSX.Element; color: string; label: string }> = {
      shortlisted: { 
        icon: <Circle className="h-3 w-3 fill-success text-success" />, 
        color: "text-success",
        label: "Shortlisted"
      },
      declined: { 
        icon: <Circle className="h-3 w-3 fill-destructive text-destructive" />, 
        color: "text-destructive",
        label: "Declined"
      },
      under_review: { 
        icon: <Circle className="h-3 w-3 fill-warning text-warning" />, 
        color: "text-warning",
        label: "Under Review"
      },
      awarded: { 
        icon: <Star className="h-3 w-3 fill-info text-info" />, 
        color: "text-info",
        label: "Awarded"
      },
      submitted: { 
        icon: <Circle className="h-3 w-3 fill-info/80 text-info/80" />, 
        color: "text-info",
        label: "Submitted"
      },
      pending: { 
        icon: <Circle className="h-3 w-3 fill-pending text-pending" />, 
        color: "text-pending",
        label: "Pending"
      },
    };
    return configs[status] || configs.pending;
  };

  const handleEditBid = async () => {
    if (!selectedBid) return;

    try {
      const { error } = await supabase
        .from('contractor_bids')
        .update({
          bid_amount: parseFloat(editedAmount),
          notes: editedNotes
        })
        .eq('id', selectedBid.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bid updated successfully",
      });

      // Refresh bids
      const { data } = await supabase
        .from('contractor_bids')
        .select('*')
        .eq('contractor_id', user!.id)
        .order('submitted_at', { ascending: false });

      const { data: projectsData } = await supabase
        .from('contractor_projects')
        .select('id, project_name')
        .eq('contractor_id', user!.id);

      const bidsWithProjects: BidWithProject[] = (data || []).map(bid => {
        const project = projectsData?.find(p => p.id === bid.project_id);
        return {
          ...bid,
          project_name: project?.project_name || 'Unknown Project',
          last_update: bid.updated_at
        };
      });

      setBids(bidsWithProjects);
      setFilteredBids(bidsWithProjects);
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating bid:", error);
      toast({
        title: "Error",
        description: "Failed to update bid",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="min-h-screen bg-background -m-6">
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractor/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Bids</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bids/projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => navigate('/contractor/projects')}>
              <FileText className="h-4 w-4 mr-2" />
              New Bid
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{bids.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-pending">
                {bids.filter(b => b.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">
                {bids.filter(b => b.status === 'accepted').length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Bids</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBids.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No bids found</p>
                <Button className="mt-4" onClick={() => navigate('/contractor/projects')}>
                  Browse Projects
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBids.map((bid) => {
                    const statusConfig = getStatusConfig(bid.status);
                    return (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium">
                          {bid.project_name}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${bid.bid_amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span>{statusConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(bid.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          {new Date(bid.last_update).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {bid.status === 'submitted' && (
                              <Dialog open={editDialogOpen && selectedBid?.id === bid.id} onOpenChange={(open) => {
                                setEditDialogOpen(open);
                                if (open) {
                                  setSelectedBid(bid);
                                  setEditedAmount(bid.bid_amount.toString());
                                  setEditedNotes(bid.notes || '');
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="default" size="sm">
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Bid</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Bid Amount</Label>
                                      <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          value={editedAmount}
                                          onChange={(e) => setEditedAmount(e.target.value)}
                                          className="pl-10"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={editedNotes}
                                        onChange={(e) => setEditedNotes(e.target.value)}
                                        placeholder="Add any notes about this bid..."
                                        rows={4}
                                      />
                                    </div>
                                    <Button onClick={handleEditBid} className="w-full">
                                      Update Bid
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (bid.project_id) {
                                  navigate(`/contractor/projects?projectId=${bid.project_id}`);
                                } else {
                                  toast({
                                    title: "Bid Details",
                                    description: bid.notes || "No additional notes",
                                  });
                                }
                              }}
                            >
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
      </div>
    </div>
    </ContractorLayout>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, FileText, Plus, Download, Eye, Paperclip } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { ArchitectMessageNotifications } from "@/components/ArchitectMessageNotifications";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateProposalForm } from "@/components/forms/CreateProposalForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Proposal {
  id: string;
  project_id: string;
  proposal_amount: number;
  design_phase: string;
  estimated_timeline: string | null;
  notes: string | null;
  status: string;
  submitted_at: string;
  attachment_urls: string[] | null;
  line_items: Array<{ description: string; amount: number }> | null;
}

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  status: string;
}

export default function ArchitectProposals() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<string | null>(null);
  const [currentAttachmentType, setCurrentAttachmentType] = useState<'pdf' | 'image' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/architect/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch proposals
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('architect_proposals')
          .select('*')
          .eq('architect_id', user.id)
          .order('submitted_at', { ascending: false });

        if (proposalsError) throw proposalsError;

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('architect_projects')
          .select('id, project_name, client_name, status')
          .eq('architect_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        setProposals((proposalsData || []) as unknown as Proposal[]);
        setProjects(projectsData || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleProposalSuccess = async () => {
    setShowCreateDialog(false);
    
    // Refetch proposals
    if (user) {
      const { data, error } = await supabase
        .from('architect_proposals')
        .select('*')
        .eq('architect_id', user.id)
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        setProposals(data as unknown as Proposal[]);
      }
    }
  };

  const handleViewAttachment = (url: string) => {
    const fileExt = url.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (fileExt === 'pdf') {
      setCurrentAttachmentType('pdf');
    } else if (imageExts.includes(fileExt || '')) {
      setCurrentAttachmentType('image');
    }
    
    setCurrentAttachment(url);
    setViewerOpen(true);
  };

  const handleDownloadAttachment = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return variants[status] || variants.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ArchitectMessageNotifications />
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={smartRenoLogo} alt="SmartReno" className="h-8" />
            <nav className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/projects')}>
                Projects
              </Button>
              <Button variant="default" size="sm">
                Proposals
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/bid-room')}>
                Bid Room
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/architect/messages')}>
                Messages
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/architect/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Proposals</h1>
            <p className="text-muted-foreground mt-1">Track and manage your design proposals</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Proposal
          </Button>
        </div>

        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No proposals submitted yet</p>
              <Button className="mt-4" onClick={() => navigate('/architect/projects')}>
                View Projects
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Proposals</CardTitle>
              <CardDescription>Review your submitted design proposals and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Design Phase</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Attachments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">Project #{proposal.project_id.slice(0, 8)}</TableCell>
                      <TableCell>{proposal.design_phase}</TableCell>
                      <TableCell>${proposal.proposal_amount.toLocaleString()}</TableCell>
                      <TableCell>{proposal.estimated_timeline || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(proposal.status)}>
                          {proposal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(proposal.submitted_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {proposal.attachment_urls && proposal.attachment_urls.length > 0 ? (
                          <TooltipProvider>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Paperclip className="h-4 w-4" />
                                    <span className="text-sm">{proposal.attachment_urls.length}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-2 max-w-xs">
                                    {proposal.attachment_urls.map((url, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <span className="text-xs truncate flex-1">
                                          {url.split('/').pop()?.split('_').slice(1).join('_') || `File ${idx + 1}`}
                                        </span>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleViewAttachment(url)}
                                          >
                                            <Eye className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleDownloadAttachment(url)}
                                          >
                                            <Download className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit New Proposal</DialogTitle>
            </DialogHeader>
            <CreateProposalForm
              projects={projects}
              onSuccess={handleProposalSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Attachment Viewer Dialog */}
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Attachment Viewer</span>
                {currentAttachment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadAttachment(currentAttachment)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-auto max-h-[70vh]">
              {currentAttachmentType === 'pdf' && currentAttachment && (
                <iframe
                  src={currentAttachment}
                  className="w-full h-[70vh] rounded-lg border"
                  title="PDF Viewer"
                />
              )}
              {currentAttachmentType === 'image' && currentAttachment && (
                <img
                  src={currentAttachment}
                  alt="Attachment"
                  className="w-full h-auto rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DocumentUpload } from "@/components/contractor/DocumentUpload";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  User,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Phone,
  Mail,
  Download,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoProjectDetail } from "@/utils/demoContractorData";

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  project_type: string;
  location: string;
  description: string;
  estimated_value: number;
  status: string;
  deadline: string;
  created_at: string;
  updated_at: string;
  contractor_id: string;
  square_footage: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  title: string;
  is_active: boolean;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  document_type: string;
  description: string;
  created_at: string;
  uploaded_by: string;
}

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_date: string;
  milestone_type: string;
  description: string;
  completed: boolean;
}

export default function ContractorProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      if (isDemoMode) {
        const demoData = getDemoProjectDetail(id);
        setProject(demoData.project as any);
        setTeamMembers(demoData.teamMembers as any);
        setDocuments(demoData.documents as any);
        setMilestones(demoData.milestones as any);
        setLoading(false);
        return;
      }
      fetchProjectDetails();
      fetchTeamMembers();
      fetchDocuments();
      fetchMilestones();
    }
  }, [id, isDemoMode]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', id)
        .order('milestone_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/contractor/auth");
        return;
      }

      const { data, error } = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Get team members from the contractor_users table
      const { data: contractorUsersData, error: contractorUsersError } = await supabase
        .from('contractor_users')
        .select('id, user_id, role, title, is_active')
        .eq('is_active', true);

      if (contractorUsersError) throw contractorUsersError;

      // Fetch profiles separately - profiles table only has id and full_name
      if (contractorUsersData && contractorUsersData.length > 0) {
        const userIds = contractorUsersData.map(cu => cu.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          // Merge the data
          const mergedData = contractorUsersData.map(cu => {
            const profile = profilesData.find((p: any) => p.id === cu.user_id);
            return {
              ...cu,
              profiles: {
                full_name: profile?.full_name || '',
                email: '',
                phone: ''
              }
            };
          });
          setTeamMembers(mergedData as any);
        }
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('contractor_project_documents')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Document deletion is disabled in demo mode" });
      return;
    }
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('contractor-project-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('contractor_project_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('contractor-project-documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      blueprint: "Blueprint",
      contract: "Contract",
      permit: "Permit",
      photo: "Photo",
      invoice: "Invoice",
      other: "Other",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "New", variant: "default" },
      in_progress: { label: "In Progress", variant: "secondary" },
      completed: { label: "Completed", variant: "outline" },
      on_hold: { label: "On Hold", variant: "destructive" },
    };

    const badge = badges[status] || { label: status, variant: "outline" as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      contractor_admin: "bg-purple-100 text-purple-800",
      project_manager: "bg-blue-100 text-blue-800",
      foreman: "bg-green-100 text-green-800",
      crew_member: "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <ContractorLayout>
        <div className="p-6">
          <div className="text-center py-12">Loading project details...</div>
        </div>
      </ContractorLayout>
    );
  }

  if (!project) {
    return (
      <ContractorLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Project not found</p>
            <Button onClick={() => navigate("/contractor/project-dashboard")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </div>
        </div>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/contractor/project-dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.project_name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{project.client_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{project.project_type}</span>
                  </div>
                </div>
              </div>
              {getStatusBadge(project.status)}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Estimated Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${project.estimated_value?.toLocaleString() || 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Deadline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.deadline ? format(new Date(project.deadline), 'MMM dd, yyyy') : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Square Footage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.square_footage?.toLocaleString() || 'N/A'} sq ft
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
              <TabsTrigger value="team">Team ({teamMembers.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p>{project.location}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                      <p className="mt-1">{project.project_type}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-2 text-sm leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="mt-1">{format(new Date(project.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="mt-1">{format(new Date(project.updated_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Key milestones and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Project Created */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                        </div>
                        {(milestones.length > 0 || project.deadline) && (
                          <div className="w-0.5 flex-1 bg-border"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">Project Created</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(project.created_at), 'MMM dd, yyyy - h:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Milestones */}
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            milestone.completed 
                              ? 'bg-green-500' 
                              : new Date(milestone.milestone_date) < new Date() 
                                ? 'bg-destructive' 
                                : 'bg-muted'
                          }`}>
                            {milestone.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            ) : (
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {(index < milestones.length - 1 || project.deadline) && (
                            <div className="w-0.5 flex-1 bg-border"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{milestone.milestone_name}</p>
                            {milestone.completed && (
                              <Badge variant="outline" className="text-green-600">Completed</Badge>
                            )}
                            {!milestone.completed && new Date(milestone.milestone_date) < new Date() && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(milestone.milestone_date), 'MMM dd, yyyy')}
                          </p>
                          {milestone.description && (
                            <p className="text-sm mt-1">{milestone.description}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Deadline */}
                    {project.deadline && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Target Deadline</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(project.deadline), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {milestones.length === 0 && !project.deadline && (
                      <p className="text-muted-foreground text-center py-4">
                        No milestones added yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-6">
              <DocumentUpload projectId={id!} onUploadComplete={fetchDocuments} />

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Project Documents</CardTitle>
                  <CardDescription>Blueprints, contracts, and other files</CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{doc.file_name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {getDocumentTypeLabel(doc.document_type)}
                                </Badge>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mb-1">{doc.description}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(doc.file_size)} • Uploaded{' '}
                                {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People working on this project</CardDescription>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No team members assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback>
                                {member.profiles?.full_name
                                  ?.split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase() || 'TM'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{member.title || member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getRoleColor(member.role)} variant="secondary">
                              {member.role.replace('_', ' ')}
                            </Badge>
                            <div className="flex gap-2">
                              {member.profiles?.email && (
                                <Button variant="ghost" size="sm">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              {member.profiles?.phone && (
                                <Button variant="ghost" size="sm">
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ContractorLayout>
  );
}

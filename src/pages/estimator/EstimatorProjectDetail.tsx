import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Upload, 
  X, 
  MapPin, 
  DollarSign, 
  Calendar, 
  CheckCircle2,
  FileText,
  Image as ImageIcon
} from "lucide-react";

interface Project {
  id: string;
  project_name: string;
  project_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  description: string;
  budget_range_min: number;
  budget_range_max: number;
  timeline_preference: string;
  workflow_status: string;
  addons: any;
  created_at: string;
}

export default function EstimatorProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      const projectData = data as any;
      setProject(projectData);
      
      // Parse existing photos if any
      if (projectData?.addons) {
        try {
          const addonsData = typeof projectData.addons === 'string' ? JSON.parse(projectData.addons) : projectData.addons;
          if (Array.isArray(addonsData)) {
            setSitePhotos(addonsData);
          }
        } catch (e) {
          console.error('Error parsing addons:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      });
      navigate('/estimator/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('estimator-site-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('estimator-site-photos')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      const updatedPhotos = [...sitePhotos, ...urls];
      setSitePhotos(updatedPhotos);

      // Update project addons
      await supabase
        .from('projects')
        .update({ addons: JSON.stringify(updatedPhotos) } as any)
        .eq('id', projectId);
      
      toast({
        title: "Success",
        description: `Uploaded ${urls.length} photo(s)`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      const updatedPhotos = sitePhotos.filter(url => url !== photoUrl);
      setSitePhotos(updatedPhotos);

      await supabase
        .from('projects')
        .update({ addons: JSON.stringify(updatedPhotos) } as any)
        .eq('id', projectId);

      toast({
        title: "Photo removed",
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Error",
        description: "Failed to remove photo",
        variant: "destructive",
      });
    }
  };

  const markVisitComplete = async () => {
    if (sitePhotos.length === 0) {
      toast({
        title: "Photos required",
        description: "Please upload at least one photo before marking visit complete",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          workflow_status: 'visit_complete',
          visit_completed_at: new Date().toISOString(),
        } as any)
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Visit marked complete",
        description: "You can now generate the estimate",
      });

      fetchProject();
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const markEstimateReady = async () => {
    setProcessing(true);
    try {
      // Update project status
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          workflow_status: 'estimate_ready',
          estimate_ready_at: new Date().toISOString(),
        } as any)
        .eq('id', projectId);

      if (updateError) throw updateError;

      // Call RFP creation edge function
      const { error: rfpError } = await supabase.functions.invoke('create-rfp-from-estimate', {
        body: { projectId }
      });

      if (rfpError) {
        console.error('RFP creation error:', rfpError);
        toast({
          title: "Warning",
          description: "Estimate marked ready, but RFP creation failed. Contact admin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Estimate ready and RFP created! Contractors will be notified.",
        });
      }

      navigate('/estimator/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to finalize estimate",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">Loading project...</div>
        </div>
      </div>
    );
  }

  const canMarkVisitComplete = project.workflow_status === 'estimator_assigned' || 
                                project.workflow_status === 'payment_confirmed' ||
                                project.workflow_status === 'visit_scheduled';
  
  const canMarkEstimateReady = project.workflow_status === 'visit_complete';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/estimator/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{project.project_name}</CardTitle>
                <CardDescription className="text-lg mt-1">{project.project_type}</CardDescription>
              </div>
              <Badge>{project.workflow_status.replace(/_/g, ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                </div>
                <p className="text-sm ml-6">
                  {project.address}<br />
                  {project.city}, {project.state} {project.zip_code}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Budget Range:</span>
                </div>
                <p className="text-sm ml-6">
                  ${project.budget_range_min?.toLocaleString()} - ${project.budget_range_max?.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Timeline:</span>
                </div>
                <p className="text-sm ml-6">{project.timeline_preference}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Description
              </h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Site Photos ({sitePhotos.length})
              </h3>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">
                    Click to upload photos
                  </span>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </Label>
                {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
              </div>

              {sitePhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sitePhotos.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Site photo ${idx + 1}`}
                        className="rounded-lg object-cover w-full h-32"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(url)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Site Visit Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Observations, measurements, concerns..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-32 mt-2"
                />
              </div>

              <div>
                <Label htmlFor="measurements">Measurements</Label>
                <Textarea
                  id="measurements"
                  placeholder="Room dimensions, material quantities..."
                  value={measurements}
                  onChange={(e) => setMeasurements(e.target.value)}
                  className="min-h-24 mt-2"
                />
              </div>
            </div>

            <Separator />

            <div className="flex gap-4">
              {canMarkVisitComplete && (
                <Button 
                  onClick={markVisitComplete} 
                  disabled={processing || sitePhotos.length === 0}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Visit Complete
                </Button>
              )}

              {canMarkEstimateReady && (
                <Button 
                  onClick={markEstimateReady} 
                  disabled={processing}
                  className="flex-1"
                >
                  Mark Estimate Ready & Create RFP
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
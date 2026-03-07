import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Upload, X, ArrowLeft, CheckCircle } from "lucide-react";

export default function HomeownerWarrantyClaim() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [formData, setFormData] = useState({
    reported_issue_title: "",
    reported_issue_desc: "",
    reported_area: "",
    severity: "functional",
    priority: "medium",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchUserProjects();
  }, []);

  async function fetchUserProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch projects where user is homeowner
      const { data: homeownerProjects } = await supabase
        .from("homeowner_projects")
        .select(`
          project_id,
          projects (
            id,
            name,
            status
          )
        `)
        .eq("homeowner_id", user.id);

      if (homeownerProjects) {
        const projectsList = homeownerProjects
          .map((hp: any) => hp.projects)
          .filter(Boolean);
        setProjects(projectsList);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > 10) {
        toast.error("Maximum 10 photos allowed");
        return;
      }
      setPhotos([...photos, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  async function uploadPhotos(claimId: string) {
    const uploadedPaths: string[] = [];

    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${claimId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('warranty-claim-photos')
        .upload(fileName, photo);

      if (error) {
        console.error("Error uploading photo:", error);
        continue;
      }

      if (data) {
        uploadedPaths.push(data.path);
        
        // Create attachment record
        await supabase
          .from('warranty_claim_attachments' as any)
          .insert({
            claim_id: claimId,
            file_name: photo.name,
            file_path: data.path,
            file_type: photo.type,
            file_size: photo.size,
            label: 'homeowner_photo',
          });
      }
    }

    return uploadedPaths;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    if (!formData.reported_issue_title.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    try {
      setLoading(true);
      setUploading(true);

      // Create warranty claim
      const { data, error } = await supabase.functions.invoke('warranty-create-claim', {
        body: {
          project_id: selectedProject,
          reported_issue_title: formData.reported_issue_title,
          reported_issue_desc: formData.reported_issue_desc,
          reported_area: formData.reported_area,
          severity: formData.severity,
          priority: formData.priority,
        },
      });

      if (error) throw error;

      // Upload photos if any
      if (photos.length > 0 && data.claim) {
        await uploadPhotos(data.claim.id);
      }

      setSubmitted(true);
      toast.success("Warranty claim submitted successfully!");

      // Reset form
      setTimeout(() => {
        navigate("/homeowner/dashboard");
      }, 3000);

    } catch (error: any) {
      console.error("Error submitting claim:", error);
      toast.error(error.message || "Failed to submit warranty claim");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Claim Submitted!</h2>
              <p className="text-muted-foreground">
                Your warranty claim has been submitted successfully. Our team will review it and contact you soon.
              </p>
            </div>
            <Button onClick={() => navigate("/homeowner/dashboard")} className="w-full">
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/homeowner/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portal
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Submit Warranty Claim</h1>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Report a Warranty Issue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Let us know about any issues covered under your warranty. Include photos and details to help us address the problem quickly.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="project">Select Project *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Issue Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Issue Summary *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Water leak under kitchen sink"
                  value={formData.reported_issue_title}
                  onChange={(e) => setFormData({ ...formData, reported_issue_title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail, when you first noticed it, and any relevant circumstances..."
                  value={formData.reported_issue_desc}
                  onChange={(e) => setFormData({ ...formData, reported_issue_desc: e.target.value })}
                  rows={5}
                />
              </div>

              {/* Area */}
              <div className="space-y-2">
                <Label htmlFor="area">Area/Location</Label>
                <Select
                  value={formData.reported_area}
                  onValueChange={(value) => setFormData({ ...formData, reported_area: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                    <SelectItem value="Bathroom">Bathroom</SelectItem>
                    <SelectItem value="Living Room">Living Room</SelectItem>
                    <SelectItem value="Bedroom">Bedroom</SelectItem>
                    <SelectItem value="Basement">Basement</SelectItem>
                    <SelectItem value="Roof">Roof</SelectItem>
                    <SelectItem value="Exterior">Exterior</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Flooring">Flooring</SelectItem>
                    <SelectItem value="Windows/Doors">Windows/Doors</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cosmetic">Cosmetic - Minor visual issue</SelectItem>
                    <SelectItem value="functional">Functional - Affects normal use</SelectItem>
                    <SelectItem value="safety">Safety - Immediate attention needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photos (Optional - Max 10)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload photos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 10MB each
                    </p>
                  </label>
                </div>

                {/* Photo Previews */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {photo.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/homeowner/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading && photos.length > 0 ? "Uploading photos..." : "Submitting..."}
                    </>
                  ) : (
                    "Submit Claim"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

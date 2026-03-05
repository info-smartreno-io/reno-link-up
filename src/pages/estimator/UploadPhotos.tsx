import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Camera, FileText, Image as ImageIcon, X, Loader2, ChevronLeft, ChevronRight, Filter, Edit, Sparkles, ArrowLeftRight, Video } from "lucide-react";
import { PhotoAnnotator } from "@/components/PhotoAnnotator";
import { RenovationImageGenerator } from "@/components/RenovationImageGenerator";
import { RenovationComparison } from "@/components/RenovationComparison";
import { VideoRecorder } from "@/components/VideoRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadedPhoto {
  id: string;
  name: string;
  url: string;
  path: string;
  category?: string;
  notes?: string;
}

const PHOTO_CATEGORIES = [
  { value: 'before', label: 'Before' },
  { value: 'during', label: 'During' },
  { value: 'after', label: 'After' },
  { value: 'damage', label: 'Damage' },
  { value: 'measurements', label: 'Measurements' },
  { value: 'video', label: 'Video' },
  { value: 'ai-concept', label: 'AI Concept' },
  { value: 'other', label: 'Other' },
];

export default function UploadPhotos() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [walkthrough, setWalkthrough] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [annotatingPhoto, setAnnotatingPhoto] = useState<UploadedPhoto | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedPhotoForAI, setSelectedPhotoForAI] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiScope, setAiScope] = useState<{
    rooms?: Array<{ name: string; scopeItems: string[] }>;
    redFlags?: string[];
    materialCategories?: string[];
    summary?: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchWalkthrough();
      fetchUploadedPhotos();
    }
  }, [id]);

  const fetchWalkthrough = async () => {
    try {
      const { data, error } = await supabase
        .from('walkthroughs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setWalkthrough(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load walkthrough details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedPhotos = async () => {
    try {
      if (!id) return;

      const { data: photosData, error } = await supabase
        .from('walkthrough_photos')
        .select('*')
        .eq('walkthrough_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithUrls = (photosData || []).map((photo) => {
        const { data } = supabase.storage
          .from('walkthrough-photos')
          .getPublicUrl(photo.file_path);

        return {
          id: photo.id,
          name: photo.file_name,
          url: data.publicUrl,
          path: photo.file_path,
          category: photo.category,
          notes: photo.notes,
        };
      });

      setUploadedPhotos(photosWithUrls);
    } catch (error: any) {
      console.error('Error fetching photos:', error);
    }
  };

  const uploadFiles = async (files: FileList) => {
    if (!files || !walkthrough || !id) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${walkthrough.walkthrough_number}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('walkthrough-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('walkthrough_photos')
          .insert({
            walkthrough_id: id,
            user_id: user.id,
            file_path: filePath,
            file_name: file.name,
            category: category || null,
            notes: notes || null,
          });

        if (dbError) throw dbError;

        return filePath;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success",
        description: `${files.length} photo(s) uploaded successfully.`,
      });

      // Reset form
      setCategory("");
      setNotes("");
      fetchUploadedPhotos();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      await uploadFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleDeletePhoto = async (photoId: string, path: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('walkthrough-photos')
        .remove([path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('walkthrough_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast({
        title: "Photo deleted",
        description: "The photo has been removed successfully.",
      });

      fetchUploadedPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhotoCategory = async (photoId: string, newCategory: string) => {
    try {
      const { error } = await supabase
        .from('walkthrough_photos')
        .update({ category: newCategory })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Category updated",
        description: "Photo category has been updated successfully.",
      });

      fetchUploadedPhotos();
      setEditingPhotoId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteUpload = async () => {
    try {
      const { error } = await supabase
        .from('walkthroughs')
        .update({ photos_uploaded: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Upload completed",
        description: "Walkthrough photos have been marked as uploaded.",
      });

      navigate('/estimator/walkthroughs');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete upload. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviousPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < uploadedPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error: any) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to take photos.",
        variant: "destructive",
      });
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    
    if (video && video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const fileList = new DataTransfer();
            fileList.items.add(file);
            await uploadFiles(fileList.files);
            
            toast({
              title: "Photo Captured",
              description: "Photo has been added to your uploads.",
            });
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleSaveAnnotation = async (annotatedBlob: Blob) => {
    if (!annotatingPhoto || !walkthrough) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create a new filename for the annotated image
      const fileName = `annotated_${Date.now()}.png`;
      const filePath = `${walkthrough.walkthrough_number}/${fileName}`;

      // Upload the annotated image
      const { error: uploadError } = await supabase.storage
        .from('walkthrough-photos')
        .upload(filePath, annotatedBlob);

      if (uploadError) throw uploadError;

      // Delete the old photo from storage
      const { error: deleteError } = await supabase.storage
        .from('walkthrough-photos')
        .remove([annotatingPhoto.path]);

      if (deleteError) console.error("Error deleting old photo:", deleteError);

      // Update the database record with new path
      const { error: updateError } = await supabase
        .from('walkthrough_photos')
        .update({ 
          file_path: filePath,
          file_name: fileName 
        })
        .eq('id', annotatingPhoto.id);

      if (updateError) throw updateError;

      toast({
        title: "Annotation Saved",
        description: "Annotated photo has been saved successfully.",
      });

      setAnnotatingPhoto(null);
      fetchUploadedPhotos();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save annotation. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleGenerateAIScope = async () => {
    if (!notes || notes.trim().length < 10) {
      toast({
        title: "More details needed",
        description: "Please add walkthrough notes (at least 10 characters) before generating AI scope",
        variant: "destructive",
      });
      return;
    }

    setAiProcessing(true);
    setAiScope(null);

    try {
      const photoUrls = uploadedPhotos.map(p => p.url);
      
      const { data, error } = await supabase.functions.invoke('ai-walkthrough-organizer', {
        body: {
          notes,
          photos: photoUrls,
          projectId: walkthrough?.project_id,
        }
      });

      if (error) throw error;

      setAiScope(data);
      toast({
        title: "AI Scope Generated",
        description: "Review and edit the AI-generated scope below",
      });
    } catch (error) {
      console.error('AI scope generation error:', error);
      toast({
        title: "AI Scope Error",
        description: error instanceof Error ? error.message : "Failed to generate scope",
        variant: "destructive",
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSaveDraftScope = async () => {
    if (!aiScope) return;

    try {
      const scopeText = aiScope.rooms?.map(room => 
        `${room.name}:\n${room.scopeItems.map(item => `  • ${item}`).join('\n')}`
      ).join('\n\n');

      const { error } = await supabase
        .from('walkthroughs')
        .update({
          notes: notes + '\n\n--- AI Generated Scope ---\n\n' + scopeText,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Draft Scope Saved",
        description: "The AI-generated scope has been saved to walkthrough notes",
      });
    } catch (error) {
      console.error('Save scope error:', error);
      toast({
        title: "Save Error",
        description: "Failed to save draft scope",
        variant: "destructive",
      });
    }
  };

  const filteredPhotos = filterCategory === "all"
    ? uploadedPhotos 
    : uploadedPhotos.filter(photo => photo.category === filterCategory);

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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Upload Walkthrough Photos</h1>
            <p className="text-muted-foreground">
              {walkthrough?.project_name} - {walkthrough?.client_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVideoRecorder(true)} className="gap-2">
              <Video className="h-4 w-4" />
              Record Video
            </Button>
            <Button variant="outline" onClick={() => setShowComparison(true)} className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Comparison
            </Button>
            <Button variant="outline" onClick={() => setShowAIGenerator(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Visualizer
            </Button>
            <Button className="gap-2" onClick={handleCompleteUpload}>
              <Upload className="h-4 w-4" />
              Complete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className={`rounded-full p-4 transition-colors ${
                    isDragging ? 'bg-primary/20' : 'bg-primary/10'
                  }`}>
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {uploading ? "Uploading..." : isDragging ? "Drop files here" : "Drop files here or click to upload"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Support for JPG, PNG, HEIC up to 20MB per file
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2" disabled={uploading} type="button">
                    <Upload className="h-4 w-4" />
                    Select Files
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    disabled={uploading} 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      startCamera();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <Label>Photo Category (Optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                rows={3}
                placeholder="Add any notes about these photos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Uploaded Photos ({filteredPhotos.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {PHOTO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPhotos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filterCategory === "all" ? "No photos uploaded yet" : `No photos in "${PHOTO_CATEGORIES.find(c => c.value === filterCategory)?.label}" category`}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <div 
                      className="aspect-square bg-muted rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setSelectedPhotoIndex(uploadedPhotos.findIndex(p => p.id === photo.id))}
                    >
                      {photo.category === 'video' ? (
                        <div className="relative w-full h-full">
                          <video
                            src={photo.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Video className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id, photo.path);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnnotatingPhoto(photo);
                      }}
                      title="Annotate Photo"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <div className="mt-2 space-y-1">
                      {editingPhotoId === photo.id ? (
                        <Select 
                          value={photo.category || ""} 
                          onValueChange={(value) => handleUpdatePhotoCategory(photo.id, value)}
                        >
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {PHOTO_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div 
                          className="flex items-center gap-1 cursor-pointer"
                          onClick={() => setEditingPhotoId(photo.id)}
                        >
                          {photo.category && (
                            <Badge variant="secondary" className="text-xs">
                              {PHOTO_CATEGORIES.find(c => c.value === photo.category)?.label}
                            </Badge>
                          )}
                          {!photo.category && (
                            <span className="text-xs text-muted-foreground hover:text-primary">
                              Add category
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground truncate">
                        {photo.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Scope Generation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Walkthrough Scope Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walkthrough-notes">Walkthrough Notes</Label>
              <Textarea
                id="walkthrough-notes"
                placeholder="Describe what you observed during the walkthrough... (e.g., 'Kitchen needs full remodel, remove wall between kitchen and living room, update all electrical, new flooring throughout')"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-32"
              />
            </div>

            <Button
              onClick={handleGenerateAIScope}
              disabled={aiProcessing || !notes || notes.length < 10}
              className="w-full"
            >
              {aiProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Scope from Notes & Photos (AI)
                </>
              )}
            </Button>

            {aiScope && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">AI-Generated Scope (Draft)</h3>
                  <Button onClick={handleSaveDraftScope} size="sm">
                    Save Draft Scope
                  </Button>
                </div>

                {aiScope.summary && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Summary</h4>
                    <p className="text-sm text-muted-foreground">{aiScope.summary}</p>
                  </div>
                )}

                {aiScope.rooms && aiScope.rooms.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Room-by-Room Scope</h4>
                    {aiScope.rooms.map((room, i) => (
                      <div key={i} className="border-l-2 border-primary pl-3">
                        <h5 className="font-medium mb-2">{room.name}</h5>
                        <ul className="text-sm space-y-1">
                          {room.scopeItems.map((item, j) => (
                            <li key={j} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {aiScope.redFlags && aiScope.redFlags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-red-600">Red Flags</h4>
                    <ul className="text-sm space-y-1">
                      {aiScope.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start text-red-600">
                          <span className="mr-2">⚠</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiScope.materialCategories && aiScope.materialCategories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Material Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiScope.materialCategories.map((cat, i) => (
                        <Badge key={i} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => navigate(`/estimator/generate-scope/${id}`)}
                  className="w-full"
                  variant="default"
                >
                  Send to Estimate Builder
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Walkthrough Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Walkthrough ID:</span>
                <p className="font-medium">{walkthrough?.walkthrough_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">
                  {walkthrough?.date ? new Date(walkthrough.date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Address:</span>
                <p className="font-medium">{walkthrough?.address}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium capitalize">{walkthrough?.status}</p>
              </div>
            </div>
            {walkthrough?.notes && (
              <div>
                <span className="text-muted-foreground text-sm">Notes:</span>
                <p className="text-sm mt-1">{walkthrough.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={selectedPhotoIndex !== null} onOpenChange={() => setSelectedPhotoIndex(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          {selectedPhotoIndex !== null && (
            <div className="relative">
              <img
                src={uploadedPhotos[selectedPhotoIndex].url}
                alt={uploadedPhotos[selectedPhotoIndex].name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                {selectedPhotoIndex + 1} / {uploadedPhotos.length}
              </div>
              {selectedPhotoIndex > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={handlePreviousPhoto}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {selectedPhotoIndex < uploadedPhotos.length - 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={handleNextPhoto}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Modal */}
      <Dialog open={showCamera} onOpenChange={(open) => {
        if (!open) stopCamera();
      }}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative bg-black">
            {stream && (
              <video
                id="camera-preview"
                autoPlay
                playsInline
                muted
                ref={(videoRef) => {
                  if (videoRef && stream) {
                    videoRef.srcObject = stream;
                  }
                }}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <Button
                size="lg"
                variant="secondary"
                onClick={stopCamera}
                className="gap-2"
              >
                <X className="h-5 w-5" />
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={capturePhoto}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Camera className="h-5 w-5" />
                Capture Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Annotator Modal */}
      {annotatingPhoto && (
        <Dialog open={!!annotatingPhoto} onOpenChange={() => setAnnotatingPhoto(null)}>
          <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
            <PhotoAnnotator
              imageUrl={annotatingPhoto.url}
              onSave={handleSaveAnnotation}
              onClose={() => setAnnotatingPhoto(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* AI Renovation Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Renovation Visualizer</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Generate New</TabsTrigger>
              <TabsTrigger value="enhance">Enhance Existing Photo</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="mt-4">
              <RenovationImageGenerator 
                walkthroughId={id}
                onImageSaved={() => {
                  fetchUploadedPhotos();
                  setShowAIGenerator(false);
                }}
              />
            </TabsContent>
            <TabsContent value="enhance" className="mt-4">
              <div className="flex flex-col gap-4">
                <Label>Select a photo to enhance</Label>
                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {uploadedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                        selectedPhotoForAI === photo.url
                          ? "border-primary ring-2 ring-primary"
                          : "border-border hover:border-primary"
                      }`}
                      onClick={() => setSelectedPhotoForAI(photo.url)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.category || 'Photo'}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
                {selectedPhotoForAI && (
                  <RenovationImageGenerator 
                    baseImage={selectedPhotoForAI}
                    walkthroughId={id}
                    onImageSaved={() => {
                      fetchUploadedPhotos();
                      setShowAIGenerator(false);
                      setSelectedPhotoForAI(null);
                    }}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Comparison View Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Before & After Comparison</DialogTitle>
          </DialogHeader>
          {id && (
            <RenovationComparison
              walkthroughId={id}
              clientName={walkthrough?.client_name}
              projectName={walkthrough?.project_name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Video Recorder Dialog */}
      <Dialog open={showVideoRecorder} onOpenChange={setShowVideoRecorder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Video Walkthrough Recorder</DialogTitle>
          </DialogHeader>
          {id && (
            <VideoRecorder
              walkthroughId={id}
              onVideoSaved={() => {
                fetchUploadedPhotos();
                setShowVideoRecorder(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useNavigate, useParams } from "react-router-dom";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { ArrowLeft, Wand2, Loader2, Copy, Download, Edit2, Save, X, Camera, Pencil, Trash2, Image as ImageIcon, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { VoiceCommands } from "@/components/VoiceCommands";


export default function GenerateScope() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("Complete kitchen and master bathroom renovation for a 2-story colonial home. Kitchen is approximately 200 sq ft, bathroom is 80 sq ft. Client wants modern finishes with neutral color palette. Budget range is $60-80k.");
  const [projectType, setProjectType] = useState("Kitchen & Bath Remodel");
  const [budgetRange, setBudgetRange] = useState("$60,000 - $80,000");
  const [generatedScope, setGeneratedScope] = useState("");
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [scopeSummary, setScopeSummary] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<any>(null);
  
  // Photo capture states
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Whiteboard states
  const whiteboardRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawWidth, setDrawWidth] = useState(2);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start editing the scope of work...',
      }),
    ],
    content: generatedScope,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
    }
  }, [id]);

  useEffect(() => {
    if (editor && generatedScope) {
      editor.commands.setContent(`<pre>${generatedScope}</pre>`);
    }
  }, [generatedScope, editor]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchLeadDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setLead(data);
        setProjectType(data.project_type || "Kitchen & Bath Remodel");
        setBudgetRange(data.estimated_budget || "$60,000 - $80,000");
        
        // Combine client notes and internal notes for description
        const notes = [data.client_notes, data.internal_notes].filter(Boolean).join("\n\n");
        if (notes) {
          setDescription(notes);
        }
      }
    } catch (error: any) {
      console.error('Error fetching lead:', error);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1920, height: 1080 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => [...prev, photoData]);
        toast({
          title: "Photo Captured",
          description: `You now have ${photos.length + 1} photo(s)`,
        });
      }
    }
  };

  const deletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Whiteboard functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = whiteboardRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = whiteboardRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawWidth;
        ctx.lineCap = 'round';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const handleVoiceTranscription = (text: string) => {
    // Append transcribed text to description with timestamp
    const timestamp = new Date().toLocaleTimeString();
    const newText = description 
      ? `${description}\n\n[${timestamp}] ${text}` 
      : `[${timestamp}] ${text}`;
    setDescription(newText);
  };

  const handleAddMeasurement = (measurement: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newText = description 
      ? `${description}\n\n[${timestamp}] MEASUREMENT: ${measurement}` 
      : `[${timestamp}] MEASUREMENT: ${measurement}`;
    setDescription(newText);
  };

  const handleAddPhotoNote = (note: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newText = description 
      ? `${description}\n\n[${timestamp}] PHOTO NOTE: ${note}` 
      : `[${timestamp}] PHOTO NOTE: ${note}`;
    setDescription(newText);
  };

  const handleMarkIssue = (issue: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newText = description 
      ? `${description}\n\n[${timestamp}] ⚠️ ISSUE: ${issue}` 
      : `[${timestamp}] ⚠️ ISSUE: ${issue}`;
    setDescription(newText);
  };

  const handleVoiceCapturePhoto = () => {
    // Trigger photo capture if camera is active
    if (isCapturing) {
      capturePhoto();
    } else {
      toast({
        title: "Camera Not Active",
        description: "Please start the camera first to capture photos",
        variant: "destructive",
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = whiteboardRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveWhiteboard = () => {
    const canvas = whiteboardRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL('image/png');
      setPhotos(prev => [...prev, imageData]);
      clearWhiteboard();
      toast({
        title: "Whiteboard Saved",
        description: "Your drawing has been added to photos",
      });
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      // Include photos in the generation request
      const { data, error } = await supabase.functions.invoke('generate-scope', {
        body: {
          description,
          projectType,
          budgetRange,
          photos: photos.length > 0 ? photos.slice(0, 5) : undefined, // Send max 5 photos
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedScope(data.scope);
      setLineItems(data.lineItems || []);
      setScopeSummary(data.summary || null);
      setGenerated(true);

      // Automatically save as change order if we have line items
      if (data.lineItems && data.lineItems.length > 0 && lead) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          const changeOrderNumber = `CO-${Date.now()}`;
          const totalAmount = data.summary?.total || data.lineItems.reduce((sum: number, item: any) => sum + (item.totalCost || 0), 0);

          const { error: coError } = await supabase
            .from('change_orders')
            .insert({
              project_name: lead.name || 'Unknown Project',
              client_name: lead.name,
              change_order_number: changeOrderNumber,
              description: `AI Generated Scope - ${projectType}`,
              original_amount: 0,
              change_amount: totalAmount,
              new_total_amount: totalAmount,
              status: 'pending',
              line_items: data.lineItems,
              reason: data.scope,
              requested_by: user?.id,
            });

          if (coError) {
            console.error('Error saving change order:', coError);
          } else {
            toast({
              title: "Success",
              description: `Scope generated and saved as ${changeOrderNumber}!`,
            });
          }
        } catch (coError) {
          console.error('Error creating change order:', coError);
        }
      } else {
        toast({
          title: "Success",
          description: "Project scope generated successfully!",
        });
      }
    } catch (error: any) {
      console.error('Error generating scope:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate scope. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing && editor ? editor.getText() : generatedScope;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied",
      description: "Scope copied to clipboard",
    });
  };

  const handleDownload = () => {
    const textToDownload = isEditing && editor ? editor.getText() : generatedScope;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scope-${lead?.name || 'project'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Scope downloaded successfully",
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editor) {
      const updatedScope = editor.getText();
      setGeneratedScope(updatedScope);
      setIsEditing(false);
      toast({
        title: "Saved",
        description: "Your edits have been saved",
      });
    }
  };

  const handleCancelEdit = () => {
    if (editor) {
      editor.commands.setContent(`<pre>${generatedScope}</pre>`);
    }
    setIsEditing(false);
  };

  const handleEditLineItem = (index: number) => {
    setEditingItemIndex(index);
    setEditedItem({ ...lineItems[index] });
  };

  const handleSaveLineItem = () => {
    if (editingItemIndex !== null && editedItem) {
      const updatedItems = [...lineItems];
      // Recalculate total cost
      editedItem.totalCost = Number(editedItem.quantity) * Number(editedItem.unitCost);
      updatedItems[editingItemIndex] = editedItem;
      setLineItems(updatedItems);
      
      // Recalculate summary
      const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
      const contingency = scopeSummary?.contingency || 0;
      setScopeSummary({
        subtotal,
        contingency,
        total: subtotal + contingency
      });

      setEditingItemIndex(null);
      setEditedItem(null);
      
      toast({
        title: "Saved",
        description: "Line item updated successfully",
      });
    }
  };

  const handleCancelEditLineItem = () => {
    setEditingItemIndex(null);
    setEditedItem(null);
  };

  const handleDeleteLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
    
    // Recalculate summary
    const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
    const contingency = scopeSummary?.contingency || 0;
    setScopeSummary({
      subtotal,
      contingency,
      total: subtotal + contingency
    });

    toast({
      title: "Deleted",
      description: "Line item removed",
    });
  };

  const handleUseScope = async () => {
    try {
      const finalScope = isEditing && editor ? editor.getText() : generatedScope;
      
      if (!id) {
        toast({
          title: "Error",
          description: "No lead ID found. Cannot save scope.",
          variant: "destructive",
        });
        return;
      }

      // Save the scope to the lead's internal notes
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          internal_notes: finalScope,
          status: 'qualified'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Scope saved to lead. Redirecting to create estimate...",
      });

      // Navigate to create estimate with the scope in state
      setTimeout(() => {
        navigate(`/estimator/prepare-estimate/${id}`, { 
          state: { scope: finalScope }
        });
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving scope:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save scope. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <EstimatorLayout>
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
            <h1 className="text-3xl font-semibold">Generate Project Scope</h1>
            <p className="text-muted-foreground">
              {lead?.name || "AI-Powered Scope Generation"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <VoiceCommands
              onAddMeasurement={handleAddMeasurement}
              onAddPhotoNote={handleAddPhotoNote}
              onMarkIssue={handleMarkIssue}
              onAddToDescription={handleVoiceTranscription}
              onCapturePhoto={handleVoiceCapturePhoto}
            />
            {generated && (
              <div className="flex gap-2">
                {!isEditing && (
                  <Button variant="outline" className="gap-2" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" className="gap-2" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Project Info</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
            <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Project Information</CardTitle>
                  <Badge variant="secondary">AI-Powered</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Project Description</Label>
                    <VoiceRecorder onTranscription={handleVoiceTranscription} />
                  </div>
                  <Textarea
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={generating || generated}
                    placeholder="Enter detailed project description or use voice notes..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the Voice Note button to dictate hands-free during walkthroughs
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Type</Label>
                    <div className="p-3 border rounded-lg bg-muted/50">{projectType}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Range</Label>
                    <div className="p-3 border rounded-lg bg-muted/50">{budgetRange}</div>
                  </div>
                </div>

                {!generated && (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating Scope...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5" />
                        Generate Project Scope
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Property Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCapturing ? (
                  <div className="space-y-4">
                    <Button onClick={startCamera} className="w-full gap-2">
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </Button>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      or
                    </div>
                    
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPhotos(prev => [...prev, reader.result as string]);
                            };
                            reader.readAsDataURL(file);
                          });
                          toast({
                            title: "Photos Added",
                            description: `${files.length} photo(s) uploaded`,
                          });
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium">Click to upload photos</p>
                        <p className="text-sm text-muted-foreground">or drag and drop</p>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg bg-black"
                    />
                    <div className="flex gap-2">
                      <Button onClick={capturePhoto} className="flex-1 gap-2">
                        <Camera className="h-4 w-4" />
                        Capture Photo
                      </Button>
                      <Button onClick={stopCamera} variant="outline">
                        Stop Camera
                      </Button>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                {photos.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Captured Photos ({photos.length})</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deletePhoto(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whiteboard">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Whiteboard</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={clearWhiteboard}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={saveWhiteboard}>
                      <Save className="h-4 w-4 mr-1" />
                      Save to Photos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-center">
                  <Label>Color:</Label>
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Label>Width:</Label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={drawWidth}
                    onChange={(e) => setDrawWidth(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">{drawWidth}px</span>
                </div>
                
                <canvas
                  ref={whiteboardRef}
                  width={800}
                  height={600}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full border-2 rounded-lg bg-white cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {generated && (
          <>
            {lineItems && lineItems.length > 0 && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Generated Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Unit Cost</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {lineItems.map((item, index) => (
                            <tr key={index} className="hover:bg-muted/30">
                              {editingItemIndex === index ? (
                                <>
                                  <td className="px-4 py-3 text-sm">
                                    <Input
                                      value={editedItem.category}
                                      onChange={(e) => setEditedItem({ ...editedItem, category: e.target.value })}
                                      className="h-8"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <Textarea
                                      value={editedItem.description}
                                      onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                                      className="min-h-[60px]"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <Input
                                      type="number"
                                      value={editedItem.quantity}
                                      onChange={(e) => setEditedItem({ ...editedItem, quantity: Number(e.target.value) })}
                                      className="h-8 text-right w-20"
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <Input
                                      value={editedItem.unit}
                                      onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value })}
                                      className="h-8 w-16"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <Input
                                      type="number"
                                      value={editedItem.unitCost}
                                      onChange={(e) => setEditedItem({ ...editedItem, unitCost: Number(e.target.value) })}
                                      className="h-8 text-right w-24"
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium">
                                    ${(Number(editedItem.quantity) * Number(editedItem.unitCost)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleSaveLineItem}
                                        className="h-7 w-7"
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={handleCancelEditLineItem}
                                        className="h-7 w-7"
                                      >
                                        <X className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-3 text-sm font-medium">{item.category}</td>
                                  <td className="px-4 py-3 text-sm max-w-xs">
                                    <div>{item.description}</div>
                                    {item.notes && (
                                      <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                                  <td className="px-4 py-3 text-sm">{item.unit}</td>
                                  <td className="px-4 py-3 text-sm text-right">
                                    ${Number(item.unitCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium">
                                    ${Number(item.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleEditLineItem(index)}
                                        className="h-7 w-7"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteLineItem(index)}
                                        className="h-7 w-7 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        {scopeSummary && (
                          <tfoot className="bg-muted/50 border-t-2">
                            <tr>
                              <td colSpan={6} className="px-4 py-3 text-sm font-medium text-right">Subtotal:</td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                ${Number(scopeSummary.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                            {scopeSummary.contingency > 0 && (
                              <tr>
                                <td colSpan={6} className="px-4 py-2 text-sm text-right text-muted-foreground">Contingency:</td>
                                <td className="px-4 py-2 text-sm text-right text-muted-foreground">
                                  ${Number(scopeSummary.contingency || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            )}
                            <tr className="border-t">
                              <td colSpan={6} className="px-4 py-3 text-base font-bold text-right">Total:</td>
                              <td className="px-4 py-3 text-base text-right font-bold">
                                ${Number(scopeSummary.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Scope of Work</CardTitle>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="gap-2">
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="border rounded-lg bg-background">
                    <div className="border-b p-2 flex gap-1 bg-muted/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className={editor?.isActive('bold') ? 'bg-muted' : ''}
                      >
                        <strong>B</strong>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className={editor?.isActive('italic') ? 'bg-muted' : ''}
                      >
                        <em>I</em>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
                      >
                        • List
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
                      >
                        1. List
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor?.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                      >
                        H2
                      </Button>
                    </div>
                    <EditorContent editor={editor} className="min-h-[400px]" />
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{generatedScope}</pre>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={handleUseScope} disabled={isEditing}>
                    Use This Scope & Create Estimate
                  </Button>
                  <Button variant="outline" onClick={() => setGenerated(false)} disabled={isEditing}>
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {generated && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                  1
                </div>
                <div>
                  <div className="font-medium">Review and edit the generated scope</div>
                  <div className="text-sm text-muted-foreground">
                    Make any necessary adjustments to match project requirements
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                  2
                </div>
                <div>
                  <div className="font-medium">Create detailed estimate</div>
                  <div className="text-sm text-muted-foreground">
                    Use this scope to prepare line-item pricing
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                  3
                </div>
                <div>
                  <div className="font-medium">Schedule walkthrough</div>
                  <div className="text-sm text-muted-foreground">
                    Verify scope details with client on-site
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
    </EstimatorLayout>
  );
}

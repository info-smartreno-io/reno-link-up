import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Calculator, Image, Video, Loader2, PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { PhotoAnnotator } from "@/components/PhotoAnnotator";
import { WhiteboardDialog } from "./WhiteboardDialog";

interface CreateChangeOrderDialogProps {
  onSuccess: () => void;
}

const CATEGORIES = [
  "Permit",
  "Architectural",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Carpentry",
  "Painting",
  "Flooring",
  "Roofing",
  "Drywall",
  "Landscaping",
  "Miscellaneous"
];

export function CreateChangeOrderDialog({ onSuccess }: CreateChangeOrderDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorExpression, setCalculatorExpression] = useState("");
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [formData, setFormData] = useState({
    project_name: "",
    client_name: "",
    change_order_number: "",
    category: "",
    description: "",
    original_amount: "",
    change_amount: "",
  });

  useEffect(() => {
    if (open) {
      generateChangeOrderNumber();
      fetchClients();
    }
  }, [open]);

  const generateChangeOrderNumber = async () => {
    try {
      const { count } = await supabase
        .from("change_orders")
        .select("*", { count: "exact", head: true });
      
      const nextNumber = (count || 0) + 1;
      const coNumber = `CO-${String(nextNumber).padStart(4, "0")}`;
      setFormData(prev => ({ ...prev, change_order_number: coNumber }));
    } catch (error) {
      console.error("Error generating CO number:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name")
        .order("name");
      
      if (leads) {
        setClients(leads.map(l => ({ id: l.id, name: l.name })));
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleGenerateWithAI = () => {
    setOpen(false);
    navigate("/estimator/generate-scope");
  };

  const handleSmartEstimate = async () => {
    if (!formData.description || !formData.category) {
      toast.error("Please enter a description and select a category first");
      return;
    }

    setEnhancingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-scope", {
        body: {
          prompt: `Enhance this ${formData.category} change order description with professional details, measurements, and specifications: ${formData.description}`
        }
      });

      if (error) throw error;

      if (data?.scope) {
        setFormData(prev => ({ ...prev, description: data.scope }));
        toast.success("Description enhanced with AI");
      }
    } catch (error) {
      console.error("Error enhancing description:", error);
      toast.error("Failed to enhance description");
    } finally {
      setEnhancingDescription(false);
    }
  };

  const handleCalculate = () => {
    try {
      // Safe math expression evaluation without eval
      const sanitized = calculatorExpression.replace(/[^0-9+\-*/().]/g, '');
      const result = Function('"use strict"; return (' + sanitized + ')')();
      setFormData(prev => ({ ...prev, change_amount: result.toString() }));
      setShowCalculator(false);
      setCalculatorExpression("");
      toast.success(`Calculated: $${result.toLocaleString()}`);
    } catch (error) {
      toast.error("Invalid calculation");
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setFormData(prev => ({ 
      ...prev, 
      description: prev.description ? `${prev.description}\n${text}` : text 
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: urlError } = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(filePath, 3600);

      if (urlError || !data?.signedUrl) {
        throw urlError || new Error('Failed to create signed URL');
      }

      setAttachments(prev => [...prev, data.signedUrl]);
      toast.success("Photo uploaded");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    }
  };

  const handleWhiteboardSave = async (dataURL: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();
      
      const fileName = `whiteboard-${Date.now()}.png`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data, error: urlError } = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(filePath, 3600);

      if (urlError || !data?.signedUrl) {
        throw urlError || new Error('Failed to create signed URL');
      }

      setAttachments(prev => [...prev, data.signedUrl]);
      toast.success("Whiteboard sketch saved");
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      toast.error("Failed to save whiteboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const changeAmount = parseFloat(formData.change_amount);
      const originalAmount = parseFloat(formData.original_amount);
      const newTotal = originalAmount + changeAmount;

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("change_orders").insert({
        project_name: formData.project_name,
        client_name: formData.client_name,
        change_order_number: formData.change_order_number,
        description: formData.description,
        original_amount: originalAmount,
        change_amount: changeAmount,
        new_total_amount: newTotal,
        reason: formData.description,
        status: "pending",
        requested_by: user?.id,
        attachments: attachments.length > 0 ? attachments : null,
      });

      if (error) throw error;

      toast.success("Change order created successfully");
      setOpen(false);
      setFormData({
        project_name: "",
        client_name: "",
        change_order_number: "",
        category: "",
        description: "",
        original_amount: "",
        change_amount: "",
      });
      setAttachments([]);
      onSuccess();
    } catch (error) {
      console.error("Error creating change order:", error);
      toast.error("Failed to create change order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Change Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Change Order</DialogTitle>
        </DialogHeader>

        {!useAI ? (
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-1">Generate Scope with AI</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Use AI to automatically generate a detailed scope of work, line items, and cost estimates for your change order.
                  </p>
                  <Button 
                    onClick={handleGenerateWithAI}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground my-4">
              or create manually
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_name">Project Name</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Select
                    value={formData.client_name}
                    onValueChange={(value) => setFormData({ ...formData, client_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="change_order_number">Change Order Number</Label>
                <Input
                  id="change_order_number"
                  value={formData.change_order_number}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Reason for Change Order</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the scope of work and reason for this change order..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSmartEstimate}
                    disabled={enhancingDescription}
                    className="gap-2"
                  >
                    {enhancingDescription ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Smart Estimate
                  </Button>
                  <VoiceRecorder onTranscription={handleVoiceTranscription} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="gap-2"
                  >
                    <Image className="h-4 w-4" />
                    Photo
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWhiteboard(true)}
                    className="gap-2"
                  >
                    <PenTool className="h-4 w-4" />
                    Whiteboard
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {attachments.length} attachment(s) added
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="original_amount">Original Amount ($)</Label>
                  <Input
                    id="original_amount"
                    type="number"
                    step="0.01"
                    value={formData.original_amount}
                    onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="change_amount">Change Amount ($)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="change_amount"
                      type="number"
                      step="0.01"
                      value={formData.change_amount}
                      onChange={(e) => setFormData({ ...formData, change_amount: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCalculator(!showCalculator)}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                  {showCalculator && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., 1500 + 250 * 2"
                        value={calculatorExpression}
                        onChange={(e) => setCalculatorExpression(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCalculate}
                      >
                        =
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {formData.original_amount && formData.change_amount && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm font-medium">New Total Amount</div>
                  <div className="text-2xl font-bold">
                    ${(parseFloat(formData.original_amount) + parseFloat(formData.change_amount)).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Change Order"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </DialogContent>

      <WhiteboardDialog
        open={showWhiteboard}
        onOpenChange={setShowWhiteboard}
        onSave={handleWhiteboardSave}
      />
    </Dialog>
  );
}

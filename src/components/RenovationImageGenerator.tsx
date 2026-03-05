import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Image as ImageIcon, Save } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RenovationImageGeneratorProps {
  baseImage?: string;
  walkthroughId?: string;
  onImageGenerated?: (imageUrl: string) => void;
  onImageSaved?: () => void;
}

const RENOVATION_PRESETS = {
  "modern-kitchen": "Transform this into a modern kitchen with white cabinets, marble countertops, stainless steel appliances, and pendant lighting. High-end, contemporary design.",
  "luxury-bathroom": "Convert this into a luxury bathroom with a freestanding soaking tub, walk-in shower with glass enclosure, double vanity, and elegant tile work.",
  "contemporary-living": "Redesign this as a contemporary living room with neutral colors, clean lines, modern furniture, and large windows with natural light.",
  "outdoor-patio": "Transform this outdoor space into a beautiful patio with outdoor seating, string lights, potted plants, and a cozy fire pit area.",
  "modern-exterior": "Modernize this home exterior with updated siding, contemporary windows, stylish front door, and landscaped front yard.",
  "open-floor-plan": "Redesign this space with an open floor plan concept, removing walls, adding a kitchen island, and creating a seamless living area.",
};

export const RenovationImageGenerator = ({ baseImage, walkthroughId, onImageGenerated, onImageSaved }: RenovationImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState("");
  const [renovationType, setRenovationType] = useState<"interior" | "exterior">("interior");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value && RENOVATION_PRESETS[value as keyof typeof RENOVATION_PRESETS]) {
      setPrompt(RENOVATION_PRESETS[value as keyof typeof RENOVATION_PRESETS]);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a renovation description");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const enhancedPrompt = baseImage
        ? `${prompt} Keep the same room layout and dimensions. Professional architectural visualization, high quality, photorealistic.`
        : `Create a photorealistic ${renovationType} renovation visualization: ${prompt}. Professional architectural rendering, high quality.`;

      const { data, error } = await supabase.functions.invoke("generate-renovation-image", {
        body: {
          prompt: enhancedPrompt,
          baseImage: baseImage || null,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("Renovation visualization generated!");
        onImageGenerated?.(data.imageUrl);
      } else {
        throw new Error("No image URL received");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate renovation visualization");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `renovation-concept-${Date.now()}.png`;
    link.click();
  };

  const saveToGallery = async () => {
    if (!generatedImage || !walkthroughId) {
      toast.error("No image to save or walkthrough ID missing");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get walkthrough details for folder structure
      const { data: walkthrough, error: walkthroughError } = await supabase
        .from('walkthroughs')
        .select('walkthrough_number')
        .eq('id', walkthroughId)
        .single();

      if (walkthroughError) throw walkthroughError;

      // Convert base64 data URL to blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Create filename
      const fileName = `ai-concept-${Date.now()}.png`;
      const filePath = `${walkthrough.walkthrough_number}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('walkthrough-photos')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save metadata to database with automatic categorization
      const { error: dbError } = await supabase
        .from('walkthrough_photos')
        .insert({
          walkthrough_id: walkthroughId,
          user_id: user.id,
          file_path: filePath,
          file_name: fileName,
          category: 'ai-concept',
          notes: `AI-generated ${renovationType} renovation concept: ${prompt.substring(0, 100)}...`
        });

      if (dbError) throw dbError;

      toast.success("AI concept saved to photo gallery!");
      onImageSaved?.();
      
      // Clear the generated image after saving
      setGeneratedImage(null);
      setPrompt("");
      setPreset("");
    } catch (error) {
      console.error("Error saving to gallery:", error);
      toast.error("Failed to save to gallery");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Renovation Visualizer</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label>Renovation Type</Label>
          <Select value={renovationType} onValueChange={(value: "interior" | "exterior") => setRenovationType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interior">Interior Renovation</SelectItem>
              <SelectItem value="exterior">Exterior Renovation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Quick Presets</Label>
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a preset or write custom..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern-kitchen">Modern Kitchen</SelectItem>
              <SelectItem value="luxury-bathroom">Luxury Bathroom</SelectItem>
              <SelectItem value="contemporary-living">Contemporary Living Room</SelectItem>
              <SelectItem value="outdoor-patio">Outdoor Patio</SelectItem>
              <SelectItem value="modern-exterior">Modern Exterior</SelectItem>
              <SelectItem value="open-floor-plan">Open Floor Plan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Renovation Description</Label>
          <Textarea
            placeholder="Describe the renovation you want to visualize (e.g., 'Modern kitchen with white cabinets, marble countertops, and pendant lighting')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button onClick={generateImage} disabled={isGenerating || !prompt.trim()} className="gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Visualization
            </>
          )}
        </Button>
      </div>

      {generatedImage && (
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Generated Renovation Concept</Label>
            <div className="flex gap-2">
              {walkthroughId && (
                <Button variant="default" size="sm" onClick={saveToGallery} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save to Gallery
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={downloadImage} className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <img
            src={generatedImage}
            alt="Generated renovation visualization"
            className="w-full h-auto rounded-lg border"
          />
        </Card>
      )}
    </div>
  );
};

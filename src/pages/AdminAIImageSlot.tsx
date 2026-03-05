import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Sparkles, Check, X, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROOM_TYPES = [
  "Kitchen", "Bathroom", "Basement", "Addition", "Exterior", "Living Room", "Bedroom"
];

const STYLES = [
  "Modern", "Farmhouse", "Transitional", "Contemporary", "Traditional", "Industrial"
];

export default function AdminAIImageSlot() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [prompt, setPrompt] = useState("");
  const [roomType, setRoomType] = useState("");
  const [style, setStyle] = useState("Modern");

  const { data: slot, isLoading: slotLoading } = useQuery({
    queryKey: ["image-slot", slotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_slots")
        .select("*, active_image:image_assets!image_slots_active_image_id_fkey(*)")
        .eq("id", slotId!)
        .single() as any;

      if (error) throw error;

      // Set default prompt based on slot
      if (!prompt && data) {
        const defaultPrompts: Record<string, string> = {
          home_hero: "Front of a modern renovated home in New Jersey, clean, bright",
          interior_hero: "Modern interior living space with high-end finishes",
          kitchen_hero: "Modern kitchen with white cabinets and marble countertops",
          bathroom_hero: "Luxury bathroom with walk-in shower and modern fixtures",
          basement_hero: "Finished basement with comfortable seating area",
          additions_hero: "Home addition showing seamless integration with existing structure",
        };
        setPrompt(defaultPrompts[data.slot_key] || "Residential renovation image");
      }

      return data;
    },
    enabled: !!slotId,
  });

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ["image-assets", slotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_assets")
        .select("*")
        .eq("slot_id", slotId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!slotId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const fullPrompt = `${roomType ? roomType + " renovation: " : ""}${prompt}${style ? ", " + style.toLowerCase() + " style" : ""}`;
      
      const { data, error } = await supabase.functions.invoke("ai-generate-image", {
        body: {
          slotId,
          prompt: fullPrompt,
          style: style.toLowerCase(),
          aspectRatio: slot?.aspect_ratio || "16:9",
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Image Generated",
        description: "Your AI image has been generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["image-assets", slotId] });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to generate image. Please try again.";
      
      if (error.message?.includes("429")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message?.includes("402")) {
        errorMessage = "AI service needs credits. Please contact support.";
      }

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (assetId: string) => {
      // First, update the asset status to approved
      await supabase
        .from("image_assets")
        .update({ status: "approved", published_at: new Date().toISOString() })
        .eq("id", assetId);

      // Then update the slot's active_image_id
      const { error } = await supabase
        .from("image_slots")
        .update({ active_image_id: assetId })
        .eq("id", slotId!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Live Image Updated",
        description: "The selected image is now live on your website!",
      });
      queryClient.invalidateQueries({ queryKey: ["image-slot", slotId] });
      queryClient.invalidateQueries({ queryKey: ["image-assets", slotId] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to set image as live. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from("image_assets")
        .update({ status: "rejected" })
        .eq("id", assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["image-assets", slotId] });
    },
  });

  if (slotLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!slot) {
    return <div>Slot not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/ai-images")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{slot.label}</h1>
          <p className="text-muted-foreground">{slot.page_path}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Live Image */}
        <Card>
          <CardHeader>
            <CardTitle>Current Live Image</CardTitle>
            <CardDescription>
              This image is currently displayed on {slot.page_path}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {slot.active_image ? (
                <img
                  src={slot.active_image.storage_path}
                  alt={slot.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No active image set
                </div>
              )}
            </div>
            {slot.active_image && (
              <div className="mt-4 text-sm space-y-1">
                <p><strong>Source:</strong> {slot.active_image.source}</p>
                <p><strong>Aspect Ratio:</strong> {slot.aspect_ratio}</p>
                {slot.active_image.published_at && (
                  <p><strong>Published:</strong> {new Date(slot.active_image.published_at).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Generate Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate with AI
            </CardTitle>
            <CardDescription>
              Describe the image you want to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Room Type (Optional)</label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want..."
                rows={4}
              />
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!prompt.trim() || generateMutation.isPending}
              className="w-full"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Variants Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Image Variants</CardTitle>
          <CardDescription>
            All generated and uploaded images for this slot
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assetsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : assets && assets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={asset.storage_path}
                      alt="Generated variant"
                      className="w-full h-full object-cover"
                    />
                    {slot.active_image_id === asset.id && (
                      <Badge className="absolute top-2 right-2 bg-primary">
                        Live
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={asset.source === 'ai' ? 'default' : 'secondary'}>
                        {asset.source === 'ai' ? 'AI' : 'Manual'}
                      </Badge>
                      <Badge variant={
                        asset.status === 'approved' ? 'default' :
                        asset.status === 'rejected' ? 'destructive' :
                        'outline'
                      }>
                        {asset.status}
                      </Badge>
                    </div>
                    {asset.prompt && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {asset.prompt}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      {slot.active_image_id !== asset.id && asset.status !== 'rejected' && (
                        <Button
                          onClick={() => setActiveMutation.mutate(asset.id)}
                          disabled={setActiveMutation.isPending}
                          size="sm"
                          className="flex-1"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Set Live
                        </Button>
                      )}
                      {asset.status !== 'rejected' && slot.active_image_id !== asset.id && (
                        <Button
                          onClick={() => rejectMutation.mutate(asset.id)}
                          disabled={rejectMutation.isPending}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No images generated yet. Create your first one above!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

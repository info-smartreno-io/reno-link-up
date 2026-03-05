import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ImageIcon, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminAIImages() {
  const navigate = useNavigate();

  const { data: slots, isLoading } = useQuery({
    queryKey: ["image-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_slots")
        .select("*, active_image:image_assets!image_slots_active_image_id_fkey(*)")
        .order("page_path") as any;

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Image Studio</h1>
          </div>
          <p className="text-muted-foreground">
            Generate and manage AI images for your website
          </p>
        </div>
      </div>

      {!slots || slots.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No Image Slots Found</h3>
              <p className="text-sm text-muted-foreground">
                Image slots will appear here once they're configured
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => (
            <Card key={slot.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative group">
                {slot.active_image ? (
                  <>
                    <img
                      src={slot.active_image.storage_path}
                      alt={slot.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-primary">
                        Live
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p className="text-sm">No image set</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    onClick={() => navigate(`/admin/ai-images/${slot.id}`)}
                    variant="secondary"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Manage Images
                  </Button>
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{slot.label}</CardTitle>
                <CardDescription className="text-xs flex items-center gap-2">
                  <span className="truncate">{slot.page_path}</span>
                  <span>•</span>
                  <span>{slot.aspect_ratio}</span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, Video, LayoutTemplate, ScrollText, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ProjectWithPhotos = {
  id: string;
  project_name: string | null;
  project_type: string | null;
  photos: string[] | null;
};

export default function HomeownerProjectFilesVisuals() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["homeowner-intake-files-visuals"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("projects")
        .select("id, project_name, project_type, photos")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[HomeownerProjectFilesVisuals] intake fallback error", error);
        return null;
      }

      const project = data as ProjectWithPhotos | null;
      if (!project?.photos || !Array.isArray(project.photos)) {
        return { project, photoUrls: [] as string[] };
      }

      const photoUrls = project.photos
        .map((path) => {
          if (!path) return null;
          const {
            data: { publicUrl },
          } = supabase.storage.from("home-photos").getPublicUrl(path);
          return publicUrl;
        })
        .filter((url): url is string => !!url);

      return { project, photoUrls };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const project = data?.project as ProjectWithPhotos | undefined;
  const photoUrls = data?.photoUrls || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => navigate("/homeowner/bid-packet")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bid packet
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              Files & visuals
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">
            All photos, videos, plans, and survey documents for this project live here so contractors can
            easily review existing conditions and design intent.
          </div>

          {project && (
            <div className="text-xs text-muted-foreground">
              Project:{" "}
              <span className="font-medium text-foreground">
                {project.project_type || project.project_name || "Renovation project"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate("/homeowner/project-photos")}
            >
              <Image className="h-3.5 w-3.5" />
              Photos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate("/homeowner/project-videos")}
            >
              <Video className="h-3.5 w-3.5" />
              Videos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate("/homeowner/project-plans")}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              3D & Plans
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate("/homeowner/project-survey")}
            >
              <ScrollText className="h-3.5 w-3.5" />
              Survey
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Photo intake from your project</p>
            {photoUrls.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Once you upload photos during intake or site visits, they&apos;ll appear here in a simple
                gallery for you and your estimator to review.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-md border bg-muted/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Project photo ${idx + 1}`}
                      className="h-32 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


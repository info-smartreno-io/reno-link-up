import { Play, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoTutorialCardProps {
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  category: string;
  thumbnail?: string;
}

export function VideoTutorialCard({
  title,
  description,
  videoUrl,
  duration,
  category,
  thumbnail,
}: VideoTutorialCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Convert YouTube watch URL to embed URL
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  return (
    <>
      <Card
        className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative aspect-video bg-muted">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Play className="h-12 w-12 text-primary/60" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-primary p-4">
              <Play className="h-8 w-8 text-primary-foreground" fill="currentColor" />
            </div>
          </div>
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
            <Clock className="mr-1 h-3 w-3" />
            {duration}
          </Badge>
        </div>
        <CardContent className="p-4">
          <Badge variant="secondary" className="mb-2">
            {category}
          </Badge>
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <iframe
              src={getEmbedUrl(videoUrl)}
              title={title}
              className="h-full w-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

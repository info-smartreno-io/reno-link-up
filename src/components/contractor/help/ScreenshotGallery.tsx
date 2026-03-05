import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Screenshot {
  src: string;
  alt: string;
  caption: string;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  title?: string;
}

export function ScreenshotGallery({ screenshots, title }: ScreenshotGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? screenshots.length - 1 : selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === screenshots.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <div>
      {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {screenshots.map((screenshot, index) => (
          <div
            key={index}
            className="group cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => setSelectedIndex(index)}
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={screenshot.src}
                alt={screenshot.alt}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <p className="p-2 text-xs text-muted-foreground line-clamp-1">
              {screenshot.caption}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-5xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {selectedIndex !== null && (
              <>
                <img
                  src={screenshots[selectedIndex].src}
                  alt={screenshots[selectedIndex].alt}
                  className="w-full rounded-t-lg"
                />
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {screenshots[selectedIndex].caption}
                  </p>
                </div>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

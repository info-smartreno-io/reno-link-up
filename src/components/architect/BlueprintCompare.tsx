import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Maximize2, Download, ArrowLeftRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlueprintFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  version: number;
  version_notes: string | null;
  created_at: string;
}

interface BlueprintCompareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version1: BlueprintFile;
  version2: BlueprintFile;
}

export function BlueprintCompare({ open, onOpenChange, version1, version2 }: BlueprintCompareProps) {
  const [zoom, setZoom] = useState(100);
  const [syncScroll, setSyncScroll] = useState(true);
  const [opacity, setOpacity] = useState(50);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('blueprints')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll) return;
    
    const sourceRef = source === 'left' ? leftScrollRef : rightScrollRef;
    const targetRef = source === 'left' ? rightScrollRef : leftScrollRef;
    
    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleDownloadBoth = async () => {
    try {
      // Download version 1
      const { data: data1, error: error1 } = await supabase.storage
        .from('blueprints')
        .download(version1.file_path);

      if (error1) throw error1;

      const url1 = URL.createObjectURL(data1);
      const link1 = document.createElement('a');
      link1.href = url1;
      link1.download = `${version1.file_name}_v${version1.version}`;
      document.body.appendChild(link1);
      link1.click();
      document.body.removeChild(link1);
      URL.revokeObjectURL(url1);

      // Download version 2
      const { data: data2, error: error2 } = await supabase.storage
        .from('blueprints')
        .download(version2.file_path);

      if (error2) throw error2;

      const url2 = URL.createObjectURL(data2);
      const link2 = document.createElement('a');
      link2.href = url2;
      link2.download = `${version2.file_name}_v${version2.version}`;
      document.body.appendChild(link2);
      link2.click();
      document.body.removeChild(link2);
      URL.revokeObjectURL(url2);

      toast({
        title: "Success",
        description: "Both versions downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: "Download failed",
        description: "Failed to download blueprint versions",
        variant: "destructive",
      });
    }
  };

  const canCompare = (version1.file_type.startsWith('image/') || version1.file_type === 'application/pdf') &&
                     (version2.file_type.startsWith('image/') || version2.file_type === 'application/pdf');

  if (!canCompare) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unable to Compare</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Both versions must be images or PDFs to enable visual comparison.
            </p>
            <Button className="mt-4" onClick={handleDownloadBoth}>
              <Download className="h-4 w-4 mr-2" />
              Download Both Versions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Compare Versions</span>
              <Badge variant="outline">v{version1.version}</Badge>
              <ArrowLeftRight className="h-4 w-4" />
              <Badge variant="outline">v{version2.version}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadBoth}>
                <Download className="h-4 w-4 mr-2" />
                Download Both
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetZoom}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                onClick={() => setViewMode('side-by-side')}
              >
                Side by Side
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'overlay' ? 'default' : 'outline'}
                onClick={() => setViewMode('overlay')}
              >
                Overlay
              </Button>
            </div>

            {viewMode === 'side-by-side' && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={syncScroll}
                  onChange={(e) => setSyncScroll(e.target.checked)}
                  className="rounded"
                />
                Sync Scroll
              </label>
            )}

            {viewMode === 'overlay' && (
              <div className="flex items-center gap-2 min-w-[200px]">
                <span className="text-sm">Opacity:</span>
                <Slider
                  value={[opacity]}
                  onValueChange={(value) => setOpacity(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm min-w-[40px]">{opacity}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-2 gap-2 h-full">
              {/* Left Side - Version 1 */}
              <div className="border rounded-lg overflow-hidden flex flex-col">
                <div className="bg-muted px-3 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">v{version1.version}</Badge>
                        <span className="text-sm font-medium">{version1.file_name}</span>
                      </div>
                      {version1.version_notes && (
                        <p className="text-xs text-muted-foreground mt-1">{version1.version_notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(version1.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div
                  ref={leftScrollRef}
                  className="flex-1 overflow-auto bg-checkered"
                  onScroll={() => handleScroll('left')}
                >
                  {version1.file_type === 'application/pdf' ? (
                    <iframe
                      src={getFileUrl(version1.file_path)}
                      className="w-full h-full min-h-[600px]"
                      title={`Version ${version1.version}`}
                    />
                  ) : (
                    <img
                      src={getFileUrl(version1.file_path)}
                      alt={`Version ${version1.version}`}
                      style={{ 
                        width: `${zoom}%`,
                        height: 'auto',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Right Side - Version 2 */}
              <div className="border rounded-lg overflow-hidden flex flex-col">
                <div className="bg-muted px-3 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">v{version2.version}</Badge>
                        <span className="text-sm font-medium">{version2.file_name}</span>
                      </div>
                      {version2.version_notes && (
                        <p className="text-xs text-muted-foreground mt-1">{version2.version_notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(version2.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div
                  ref={rightScrollRef}
                  className="flex-1 overflow-auto bg-checkered"
                  onScroll={() => handleScroll('right')}
                >
                  {version2.file_type === 'application/pdf' ? (
                    <iframe
                      src={getFileUrl(version2.file_path)}
                      className="w-full h-full min-h-[600px]"
                      title={`Version ${version2.version}`}
                    />
                  ) : (
                    <img
                      src={getFileUrl(version2.file_path)}
                      alt={`Version ${version2.version}`}
                      style={{ 
                        width: `${zoom}%`,
                        height: 'auto',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Overlay Mode */
            <div className="border rounded-lg overflow-auto h-full bg-checkered relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative" style={{ width: `${zoom}%` }}>
                  {version1.file_type.startsWith('image/') && version2.file_type.startsWith('image/') ? (
                    <>
                      <img
                        src={getFileUrl(version1.file_path)}
                        alt={`Version ${version1.version}`}
                        className="w-full h-auto"
                      />
                      <img
                        src={getFileUrl(version2.file_path)}
                        alt={`Version ${version2.version}`}
                        className="absolute top-0 left-0 w-full h-auto"
                        style={{ opacity: opacity / 100 }}
                      />
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground p-8">
                      Overlay mode only works with images
                    </div>
                  )}
                </div>
              </div>
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span>v{version1.version} (base)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary/50 rounded"></div>
                    <span>v{version2.version} (overlay at {opacity}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

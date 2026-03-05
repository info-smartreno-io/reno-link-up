import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Triangle, Line } from "fabric";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Square, Circle as CircleIcon, Triangle as TriangleIcon, Minus, Eraser, Trash2, Download, MousePointer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WhiteboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (imageUrl: string) => void;
}

export function WhiteboardDialog({ open, onOpenChange, onSave }: WhiteboardDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle" | "triangle" | "line" | "eraser">("draw");
  const [brushSize, setBrushSize] = useState(2);

  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    const brush = new PencilBrush(canvas);
    brush.color = activeColor;
    brush.width = brushSize;
    canvas.freeDrawingBrush = brush;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [open]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
    
    if (fabricCanvas.freeDrawingBrush) {
      if (activeTool === "eraser") {
        fabricCanvas.freeDrawingBrush.color = "#ffffff";
        fabricCanvas.freeDrawingBrush.width = 20;
      } else if (activeTool === "draw") {
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
      }
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        radius: 50,
      });
      fabricCanvas.add(circle);
    } else if (tool === "triangle") {
      const triangle = new Triangle({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(triangle);
    } else if (tool === "line") {
      const line = new Line([50, 50, 200, 200], {
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas.add(line);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast.success("Canvas cleared");
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });
    
    onSave(dataURL);
    toast.success("Whiteboard saved");
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });
    
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Whiteboard downloaded");
  };

  const colors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Whiteboard - Draw Diagrams & Annotations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
            <Button
              type="button"
              variant={activeTool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("select")}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeTool === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("draw")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeTool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("eraser")}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeTool === "rectangle" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("rectangle")}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeTool === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("circle")}
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeTool === "triangle" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("triangle")}
            >
              <TriangleIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeTool === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolClick("line")}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="h-8 w-px bg-border mx-2" />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Color Picker & Brush Size */}
          <div className="flex gap-4 items-center p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      activeColor === color ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Brush Size: {brushSize}px</Label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="border-2 border-border rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save to Change Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

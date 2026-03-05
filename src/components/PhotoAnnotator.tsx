import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Line, IText, FabricImage, Path, Group, Point } from "fabric";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Minus, 
  Eraser,
  Download,
  Undo,
  Redo,
  MousePointer,
  ArrowRight,
  Ruler,
  Gauge,
  FileText
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { Document, Page, Text, Image, View, StyleSheet } from "@react-pdf/renderer";

interface PhotoAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageBlob: Blob) => void;
  onClose: () => void;
}

type Tool = "select" | "draw" | "rectangle" | "circle" | "text" | "line" | "eraser" | "arrow" | "dimension";

const COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Purple", value: "#a855f7" },
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
];

const TEMPLATES = [
  {
    id: "damage-assessment",
    name: "Damage Assessment",
    description: "Mark damaged areas with circles and notes",
    items: [
      { type: "circle", left: 150, top: 150, radius: 60, color: "#ef4444", strokeWidth: 3 },
      { type: "arrow", x1: 220, y1: 150, x2: 280, y2: 120, color: "#ef4444" },
      { type: "text", left: 290, top: 105, text: "Damage location", color: "#ef4444" },
    ]
  },
  {
    id: "room-measurements",
    name: "Room Measurements",
    description: "Add dimension lines for walls and features",
    items: [
      { type: "dimension", x1: 100, y1: 100, x2: 300, y2: 100, color: "#3b82f6", measurement: "10ft" },
      { type: "dimension", x1: 100, y1: 100, x2: 100, y2: 250, color: "#3b82f6", measurement: "8ft" },
      { type: "text", left: 180, top: 170, text: "Room dimensions", color: "#3b82f6" },
    ]
  },
  {
    id: "material-locations",
    name: "Material Locations",
    description: "Mark where materials or fixtures will go",
    items: [
      { type: "rectangle", left: 120, top: 120, width: 120, height: 80, color: "#22c55e", strokeWidth: 3 },
      { type: "arrow", x1: 240, y1: 160, x2: 300, y2: 160, color: "#22c55e" },
      { type: "text", left: 310, top: 145, text: "New fixture", color: "#22c55e" },
    ]
  },
];

export const PhotoAnnotator = ({ imageUrl, onSave, onClose }: PhotoAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(3);
  const [measurement, setMeasurement] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [calibrationFactor, setCalibrationFactor] = useState<number | null>(null);
  const [measurementUnit, setMeasurementUnit] = useState<"ft" | "m" | "in">("ft");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState("");
  const [calibrationLine, setCalibrationLine] = useState<Line | null>(null);
  const [reportNotes, setReportNotes] = useState("");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f3f4f6",
    });

    // Load the image
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      // Scale image to fit canvas
      const scale = Math.min(
        canvas.width! / img.width!,
        canvas.height! / img.height!
      );
      
      img.scale(scale);
      img.selectable = false;
      img.evented = false;
      
      canvas.add(img);
      canvas.centerObject(img);
      canvas.renderAll();
    });

    // Initialize drawing brush
    const brush = new PencilBrush(canvas);
    brush.color = activeColor;
    brush.width = brushSize;
    canvas.freeDrawingBrush = brush;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }

    if (activeTool === "eraser" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = "#f3f4f6"; // Background color
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
      fabricCanvas.isDrawingMode = true;
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const createArrow = (x1: number, y1: number, x2: number, y2: number) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;
    
    // Arrow line
    const line = new Line([x1, y1, x2, y2], {
      stroke: activeColor,
      strokeWidth: brushSize,
    });

    // Arrow head (triangle)
    const arrowHead = new Path(
      `M ${x2} ${y2} L ${x2 - headLength * Math.cos(angle - Math.PI / 6)} ${y2 - headLength * Math.sin(angle - Math.PI / 6)} L ${x2 - headLength * Math.cos(angle + Math.PI / 6)} ${y2 - headLength * Math.sin(angle + Math.PI / 6)} Z`,
      {
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 1,
      }
    );

    const arrow = new Group([line, arrowHead]);
    return arrow;
  };

  const createDimensionLine = (x1: number, y1: number, x2: number, y2: number) => {
    // Calculate distance in pixels
    const distanceInPixels = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    let displayText: string;
    if (measurement) {
      displayText = measurement;
    } else if (calibrationFactor) {
      // Convert pixels to real-world units
      const realDistance = distanceInPixels / calibrationFactor;
      displayText = `${realDistance.toFixed(1)}${measurementUnit}`;
    } else {
      displayText = `${Math.round(distanceInPixels)}px`;
    }
    
    // Main dimension line
    const line = new Line([x1, y1, x2, y2], {
      stroke: activeColor,
      strokeWidth: brushSize,
    });

    // End markers (perpendicular lines)
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const markerLength = 10;
    
    const marker1 = new Line([
      x1 - markerLength * Math.sin(angle),
      y1 + markerLength * Math.cos(angle),
      x1 + markerLength * Math.sin(angle),
      y1 - markerLength * Math.cos(angle)
    ], {
      stroke: activeColor,
      strokeWidth: brushSize,
    });

    const marker2 = new Line([
      x2 - markerLength * Math.sin(angle),
      y2 + markerLength * Math.cos(angle),
      x2 + markerLength * Math.sin(angle),
      y2 - markerLength * Math.cos(angle)
    ], {
      stroke: activeColor,
      strokeWidth: brushSize,
    });

    // Measurement text
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const text = new IText(displayText, {
      left: midX,
      top: midY - 15,
      fill: activeColor,
      fontSize: 16,
      fontFamily: "Arial",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    });

    const dimensionGroup = new Group([line, marker1, marker2, text]);
    return dimensionGroup;
  };

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: brushSize,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === "line") {
      const line = new Line([50, 100, 200, 100], {
        stroke: activeColor,
        strokeWidth: brushSize,
      });
      fabricCanvas.add(line);
      fabricCanvas.setActiveObject(line);
    } else if (tool === "arrow") {
      const arrow = createArrow(50, 100, 200, 100);
      fabricCanvas.add(arrow);
      fabricCanvas.setActiveObject(arrow);
    } else if (tool === "dimension") {
      const dimension = createDimensionLine(50, 100, 200, 100);
      fabricCanvas.add(dimension);
      fabricCanvas.setActiveObject(dimension);
      setMeasurement("");
    } else if (tool === "text") {
      const text = new IText(measurement || "Double click to edit", {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 20,
        fontFamily: "Arial",
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      setMeasurement("");
    }

    fabricCanvas.renderAll();
  };

  const applyTemplate = (templateId: string) => {
    if (!fabricCanvas) return;

    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    template.items.forEach(item => {
      if (item.type === "circle") {
        const circle = new Circle({
          left: item.left,
          top: item.top,
          fill: "transparent",
          stroke: item.color,
          strokeWidth: item.strokeWidth || brushSize,
          radius: item.radius,
        });
        fabricCanvas.add(circle);
      } else if (item.type === "rectangle") {
        const rect = new Rect({
          left: item.left,
          top: item.top,
          fill: "transparent",
          stroke: item.color,
          strokeWidth: item.strokeWidth || brushSize,
          width: item.width,
          height: item.height,
        });
        fabricCanvas.add(rect);
      } else if (item.type === "arrow") {
        const arrow = createArrow(item.x1, item.y1, item.x2, item.y2);
        arrow.set({ stroke: item.color });
        fabricCanvas.add(arrow);
      } else if (item.type === "dimension") {
        const prevMeasurement = measurement;
        setMeasurement(item.measurement || "");
        const dimension = createDimensionLine(item.x1, item.y1, item.x2, item.y2);
        dimension.set({ stroke: item.color });
        fabricCanvas.add(dimension);
        setMeasurement(prevMeasurement);
      } else if (item.type === "text") {
        const text = new IText(item.text, {
          left: item.left,
          top: item.top,
          fill: item.color,
          fontSize: 16,
          fontFamily: "Arial",
        });
        fabricCanvas.add(text);
      }
    });

    fabricCanvas.renderAll();
    setSelectedTemplate("");
  };

  const startCalibration = () => {
    if (!fabricCanvas) return;
    
    setIsCalibrating(true);
    setActiveTool("select");
    fabricCanvas.isDrawingMode = false;
    
    // Create a calibration line
    const line = new Line([100, 200, 300, 200], {
      stroke: "#f97316",
      strokeWidth: 3,
      selectable: true,
    });
    
    fabricCanvas.add(line);
    fabricCanvas.setActiveObject(line);
    setCalibrationLine(line);
    
    toast("Draw or adjust the line to match a known distance, then enter the real-world measurement below.");
  };

  const applyCalibration = () => {
    if (!calibrationLine || !calibrationDistance || !fabricCanvas) {
      toast.error("Please draw a calibration line and enter its real-world distance.");
      return;
    }

    const distance = parseFloat(calibrationDistance);
    if (isNaN(distance) || distance <= 0) {
      toast.error("Please enter a valid distance.");
      return;
    }

    // Calculate pixel distance of calibration line
    const x1 = calibrationLine.x1 || 0;
    const y1 = calibrationLine.y1 || 0;
    const x2 = calibrationLine.x2 || 0;
    const y2 = calibrationLine.y2 || 0;
    const pixelDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    // Calculate calibration factor (pixels per unit)
    const factor = pixelDistance / distance;
    setCalibrationFactor(factor);

    // Remove calibration line
    fabricCanvas.remove(calibrationLine);
    setCalibrationLine(null);
    setIsCalibrating(false);
    setCalibrationDistance("");

    toast.success(`Calibration set! All measurements will now use ${measurementUnit}.`);
  };

  const cancelCalibration = () => {
    if (calibrationLine && fabricCanvas) {
      fabricCanvas.remove(calibrationLine);
    }
    setCalibrationLine(null);
    setIsCalibrating(false);
    setCalibrationDistance("");
  };

  const resetCalibration = () => {
    setCalibrationFactor(null);
    setCalibrationDistance("");
    toast("Calibration reset. Measurements will show in pixels.");
  };

  const generatePDFReport = async () => {
    if (!fabricCanvas) return;

    try {
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });

      const styles = StyleSheet.create({
        page: {
          padding: 40,
          fontFamily: 'Helvetica',
        },
        header: {
          marginBottom: 20,
          borderBottom: '2 solid #3b82f6',
          paddingBottom: 10,
        },
        title: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1e40af',
          marginBottom: 5,
        },
        subtitle: {
          fontSize: 12,
          color: '#64748b',
        },
        section: {
          marginTop: 20,
          marginBottom: 10,
        },
        sectionTitle: {
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 8,
          color: '#334155',
        },
        image: {
          marginVertical: 15,
          maxHeight: 400,
          objectFit: 'contain',
        },
        notesBox: {
          backgroundColor: '#f8fafc',
          padding: 15,
          borderRadius: 4,
          border: '1 solid #e2e8f0',
          marginTop: 10,
        },
        notesText: {
          fontSize: 11,
          lineHeight: 1.5,
          color: '#475569',
        },
        footer: {
          position: 'absolute',
          bottom: 30,
          left: 40,
          right: 40,
          fontSize: 10,
          color: '#94a3b8',
          borderTop: '1 solid #e2e8f0',
          paddingTop: 10,
        },
        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 5,
          fontSize: 11,
          color: '#64748b',
        },
      });

      const PDFDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Photo Annotation Report</Text>
              <Text style={styles.subtitle}>
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Text>
            </View>

            {/* Calibration Info */}
            {calibrationFactor && (
              <View style={styles.infoRow}>
                <Text>Calibration: Active</Text>
                <Text>Unit: {measurementUnit}</Text>
              </View>
            )}

            {/* Annotated Image */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Annotated Photo</Text>
              <Image src={dataURL} style={styles.image} />
            </View>

            {/* Notes Section */}
            {reportNotes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes & Observations</Text>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{reportNotes}</Text>
                </View>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text>SmartReno - Professional Estimation Report</Text>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(<PDFDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `annotation-report-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 1) { // Keep the background image
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
    }
  };

  const handleSaveAnnotation = async () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });

    // Convert data URL to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();
    
    onSave(blob);
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });

    const link = document.createElement('a');
    link.download = `annotated-photo-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Calibration Section */}
      <div className="flex flex-col gap-2 p-3 bg-background rounded-lg border">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Measurement Calibration</Label>
          {calibrationFactor && (
            <span className="text-xs text-muted-foreground">
              Active: {measurementUnit}
            </span>
          )}
        </div>
        
        {!isCalibrating ? (
          <div className="flex items-center gap-2">
            <Select value={measurementUnit} onValueChange={(value: "ft" | "m" | "in") => setMeasurementUnit(value)}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
                <SelectItem value="in">Inches (in)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={startCalibration}
              className="gap-2"
            >
              <Gauge className="h-4 w-4" />
              Set Scale
            </Button>
            {calibrationFactor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetCalibration}
              >
                Reset
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={`Distance (${measurementUnit})`}
              value={calibrationDistance}
              onChange={(e) => setCalibrationDistance(e.target.value)}
              className="w-32 h-8"
              step="0.1"
            />
            <Button
              variant="default"
              size="sm"
              onClick={applyCalibration}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelCalibration}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Templates Section */}
      <div className="flex flex-col gap-2 p-3 bg-background rounded-lg border">
        <Label className="text-sm font-semibold">Quick Templates</Label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((template) => (
            <Button
              key={template.id}
              variant={selectedTemplate === template.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTemplate(template.id);
                applyTemplate(template.id);
              }}
              className="flex-col h-auto py-2 px-3"
              title={template.description}
            >
              <span className="text-xs font-medium">{template.name}</span>
              <span className="text-[10px] text-muted-foreground">{template.description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-background rounded-lg border">
        <div className="flex items-center gap-1">
          <Button
            variant={activeTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("select")}
            title="Select"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("draw")}
            title="Draw"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("eraser")}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToolClick("rectangle")}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToolClick("circle")}
            title="Circle"
          >
            <CircleIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToolClick("line")}
            title="Line"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToolClick("arrow")}
            title="Arrow"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToolClick("dimension")}
            title="Dimension Line"
          >
            <Ruler className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Measurement (e.g., 10ft)"
            value={measurement}
            onChange={(e) => setMeasurement(e.target.value)}
            className="w-40 h-8"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToolClick("text")}
            title="Add Text"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
        <div className="flex items-center gap-1">
          {COLORS.map((color) => (
            <button
              key={color.value}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                activeColor === color.value ? "border-foreground scale-110" : "border-border"
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => setActiveColor(color.value)}
              title={color.name}
            />
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Brush Size */}
        <div className="flex items-center gap-2 min-w-32">
          <Label className="text-xs whitespace-nowrap">Size: {brushSize}px</Label>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={1}
            max={20}
            step={1}
            className="w-20"
          />
        </div>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-muted rounded-lg p-4 overflow-auto">
        <canvas ref={canvasRef} className="border border-border shadow-lg" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 p-3 bg-background rounded-lg border">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold">Report Notes (optional)</Label>
        </div>
        <Input
          type="text"
          placeholder="Add notes or observations for the PDF report..."
          value={reportNotes}
          onChange={(e) => setReportNotes(e.target.value)}
          className="h-9"
        />
        <div className="flex justify-between items-center gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download Image
            </Button>
            <Button variant="outline" onClick={generatePDFReport} className="gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handleSaveAnnotation} className="gap-2">
              Save Annotation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

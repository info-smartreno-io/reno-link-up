import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileDown, Plus, X, ArrowLeftRight } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Document, Page, Text, Image, View, StyleSheet } from "@react-pdf/renderer";

interface Photo {
  id: string;
  url: string;
  category?: string;
  notes?: string;
  file_name: string;
}

interface Comparison {
  id: string;
  before: Photo;
  after: Photo;
}

interface RenovationComparisonProps {
  walkthroughId: string;
  clientName?: string;
  projectName?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
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
    marginBottom: 3,
  },
  comparisonSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#334155',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  imageContainer: {
    width: '48%',
  },
  imageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#475569',
  },
  image: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    border: '1 solid #e2e8f0',
  },
  notes: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 5,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: '#94a3b8',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#94a3b8',
  },
});

export const RenovationComparison = ({ walkthroughId, clientName, projectName }: RenovationComparisonProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [selectedBefore, setSelectedBefore] = useState<string>("");
  const [selectedAfter, setSelectedAfter] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [walkthroughId]);

  const fetchPhotos = async () => {
    try {
      const { data: photosData, error } = await supabase
        .from('walkthrough_photos')
        .select('*')
        .eq('walkthrough_id', walkthroughId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithUrls = (photosData || []).map((photo) => {
        const { data } = supabase.storage
          .from('walkthrough-photos')
          .getPublicUrl(photo.file_path);

        return {
          id: photo.id,
          url: data.publicUrl,
          category: photo.category,
          notes: photo.notes,
          file_name: photo.file_name,
        };
      });

      setPhotos(photosWithUrls);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error("Failed to load photos");
    }
  };

  const addComparison = () => {
    if (!selectedBefore || !selectedAfter) {
      toast.error("Please select both before and after photos");
      return;
    }

    const beforePhoto = photos.find(p => p.id === selectedBefore);
    const afterPhoto = photos.find(p => p.id === selectedAfter);

    if (!beforePhoto || !afterPhoto) return;

    const newComparison: Comparison = {
      id: `${Date.now()}`,
      before: beforePhoto,
      after: afterPhoto,
    };

    setComparisons([...comparisons, newComparison]);
    setSelectedBefore("");
    setSelectedAfter("");
    toast.success("Comparison added");
  };

  const removeComparison = (id: string) => {
    setComparisons(comparisons.filter(c => c.id !== id));
  };

  const generatePDF = async () => {
    if (comparisons.length === 0) {
      toast.error("Add at least one comparison to generate PDF");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const PDFDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Renovation Comparison Report</Text>
              {projectName && <Text style={styles.subtitle}>Project: {projectName}</Text>}
              {clientName && <Text style={styles.subtitle}>Client: {clientName}</Text>}
              <Text style={styles.subtitle}>
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Text>
            </View>

            {/* Comparisons */}
            {comparisons.map((comparison, index) => (
              <View key={comparison.id} style={styles.comparisonSection}>
                <Text style={styles.comparisonTitle}>
                  Comparison {index + 1}
                </Text>
                <View style={styles.imageRow}>
                  {/* Before Image */}
                  <View style={styles.imageContainer}>
                    <Text style={styles.imageLabel}>Before</Text>
                    <Image src={comparison.before.url} style={styles.image} />
                    {comparison.before.notes && (
                      <Text style={styles.notes}>{comparison.before.notes}</Text>
                    )}
                  </View>

                  {/* After Image */}
                  <View style={styles.imageContainer}>
                    <Text style={styles.imageLabel}>AI Renovation Concept</Text>
                    <Image src={comparison.after.url} style={styles.image} />
                    {comparison.after.notes && (
                      <Text style={styles.notes}>{comparison.after.notes}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {/* Footer */}
            <View style={styles.footer}>
              <Text>SmartReno - Professional Renovation Visualization</Text>
            </View>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} fixed />
          </Page>
        </Document>
      );

      const blob = await pdf(<PDFDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `renovation-comparison-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const beforePhotos = photos.filter(p => p.category !== 'ai-concept');
  const afterPhotos = photos.filter(p => p.category === 'ai-concept');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Before & After Comparison</h3>
        </div>
        <Button
          onClick={generatePDF}
          disabled={comparisons.length === 0 || isGeneratingPDF}
          className="gap-2"
        >
          {isGeneratingPDF ? (
            <>Generating...</>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Export PDF
            </>
          )}
        </Button>
      </div>

      {/* Add Comparison Section */}
      <Card className="p-4">
        <Label className="text-sm font-semibold mb-3 block">Add New Comparison</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Before Photo</Label>
            <Select value={selectedBefore} onValueChange={setSelectedBefore}>
              <SelectTrigger>
                <SelectValue placeholder="Select original photo" />
              </SelectTrigger>
              <SelectContent>
                {beforePhotos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {photo.category ? `${photo.category} - ` : ''}{photo.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">AI Concept Photo</Label>
            <Select value={selectedAfter} onValueChange={setSelectedAfter}>
              <SelectTrigger>
                <SelectValue placeholder="Select AI concept" />
              </SelectTrigger>
              <SelectContent>
                {afterPhotos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {photo.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={addComparison} className="mt-4 gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          Add Comparison
        </Button>
      </Card>

      {/* Comparisons Grid */}
      {comparisons.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No comparisons added yet. Select before and after photos to create a comparison.
        </Card>
      ) : (
        <div className="grid gap-4">
          {comparisons.map((comparison, index) => (
            <Card key={comparison.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Comparison {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeComparison(comparison.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground">Before</Label>
                  <img
                    src={comparison.before.url}
                    alt="Before"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  {comparison.before.notes && (
                    <p className="text-xs text-muted-foreground italic">{comparison.before.notes}</p>
                  )}
                </div>

                {/* After */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground">AI Renovation Concept</Label>
                  <img
                    src={comparison.after.url}
                    alt="After - AI Concept"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  {comparison.after.notes && (
                    <p className="text-xs text-muted-foreground italic">{comparison.after.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

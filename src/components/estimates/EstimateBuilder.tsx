import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Download, 
  FileText, 
  Layers, 
  Search,
  Camera, 
  StickyNote,
  Calculator,
  Loader2,
  Sparkles,
  MoreVertical,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateCategorySection } from "./EstimateCategorySection";
import { EstimateSummaryCard } from "./EstimateSummaryCard";
import { PricingGuideSearch } from "./PricingGuideSearch";
import { EstimateProjectInfo } from "./EstimateProjectInfo";
import { EstimateNotesTab, DEFAULT_TERMS } from "./EstimateNotesTab";
import { useEstimateBuilder, ESTIMATE_CATEGORIES } from "@/hooks/useEstimateBuilder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { pdf } from '@react-pdf/renderer';
import { EstimatePDF } from "./EstimatePDF";

interface EstimateBuilderProps {
  leadData?: any;
  leadId?: string;
}

export function EstimateBuilder({ leadData, leadId }: EstimateBuilderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("project-info");
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  
  const {
    lineItems,
    projectInfo,
    notes,
    permitsFees,
    contingency,
    markupMultiplier,
    totals,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateProjectInfo,
    updateNotes,
    setPermitsFees,
    setContingency,
    setMarkupMultiplier,
    getItemsByCategory,
    addFromPricingGuide,
    setLineItems,
  } = useEstimateBuilder(leadData);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const estimateData = {
        user_id: user.id,
        project_name: projectInfo.projectCategory,
        client_name: projectInfo.customerName,
        estimate_number: projectInfo.estimateNumber,
        amount: totals.grandTotal,
        notes: notes.customerNotes,
        line_items: lineItems as any,
        materials_cost: totals.materialsCost,
        labor_cost: totals.laborCost,
        permits_fees: permitsFees,
        contingency: contingency,
        status: 'draft' as const,
        project_id: leadId,
      };

      const { error } = await supabase
        .from('estimates')
        .insert(estimateData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Estimate saved as draft",
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdfLineItems = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        material_cost: item.materialCost,
        labor_cost: item.laborCost,
        total_cost: item.totalCost,
      }));

      const blob = await pdf(
        <EstimatePDF
          estimateNumber={projectInfo.estimateNumber}
          clientName={projectInfo.customerName}
          projectName={projectInfo.projectCategory}
          projectDescription={projectInfo.projectDescription}
          validUntil={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          lineItems={pdfLineItems}
          materialsCost={totals.materialsCost}
          laborCost={totals.laborCost}
          permitsFees={permitsFees}
          contingency={contingency}
          notes={notes.customerNotes}
          terms={notes.termsAndConditions || DEFAULT_TERMS}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectInfo.estimateNumber}_${projectInfo.customerName.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF exported successfully",
      });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-estimate-generator', {
        body: {
          projectId: leadId,
          scope: projectInfo.projectDescription,
          notes: projectInfo.projectDescription,
          address: `${projectInfo.serviceAddress}, ${projectInfo.serviceCity}, ${projectInfo.serviceState} ${projectInfo.serviceZip}`,
          zip: projectInfo.serviceZip,
        }
      });

      if (error) throw error;

      if (data?.lineItems) {
        const newItems = data.lineItems.map((item: any) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: item.description,
          quantity: item.quantity || 1,
          unit: item.unit || 'UNIT',
          materialCost: 0,
          laborCost: 0,
          totalCost: 0,
          category: item.category || 'General Conditions',
        }));
        
        setLineItems(prev => [...prev, ...newItems]);
        setActiveTab('line-items');
        
        toast({
          title: "AI Draft Generated",
          description: `Added ${newItems.length} line items. Review and add pricing.`,
        });
      }
    } catch (error: any) {
      console.error('Error generating AI draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI draft",
        variant: "destructive",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  // Calculate grand total for mobile footer
  const subtotal = totals.materialsCost + totals.laborCost + permitsFees + contingency;
  const multiplier = parseFloat(markupMultiplier) || 1;
  const salePrice = subtotal * multiplier;
  const taxRate = 6.625;
  const taxAmount = (salePrice * taxRate) / 100;
  const grandTotal = salePrice + taxAmount;

  return (
    <div className="min-h-screen bg-muted/20 pb-20 lg:pb-0">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-3 md:px-4 py-2 md:py-3">
          {/* Mobile Header */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/estimator/dashboard")}
                className="h-9 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                  className="h-9 px-2"
                >
                  {generatingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
                <Button size="sm" className="h-9 px-3">
                  <Send className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSaveDraft} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="px-1">
              <h1 className="text-base font-semibold truncate">Create Estimate</h1>
              <p className="text-xs text-muted-foreground truncate">
                {projectInfo.customerName || "New Customer"} • {projectInfo.estimateNumber}
              </p>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/estimator/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Create Estimate</h1>
                <p className="text-sm text-muted-foreground">
                  {projectInfo.customerName || "New Customer"} • {projectInfo.estimateNumber}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={generatingAI}
              >
                {generatingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Draft
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send Estimate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Mobile Scrollable Tabs */}
              <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 mb-4 md:mb-6">
                <TabsList className="inline-flex md:grid md:w-full md:grid-cols-5 min-w-max md:min-w-0">
                  <TabsTrigger value="project-info" className="gap-1.5 md:gap-2 px-3 md:px-4 text-xs md:text-sm whitespace-nowrap">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Project</span> Info
                  </TabsTrigger>
                  <TabsTrigger value="line-items" className="gap-1.5 md:gap-2 px-3 md:px-4 text-xs md:text-sm whitespace-nowrap">
                    <Layers className="h-4 w-4" />
                    Items
                    {lineItems.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{lineItems.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pricing-guide" className="gap-1.5 md:gap-2 px-3 md:px-4 text-xs md:text-sm whitespace-nowrap">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Pricing</span> Guide
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="gap-1.5 md:gap-2 px-3 md:px-4 text-xs md:text-sm whitespace-nowrap">
                    <Camera className="h-4 w-4" />
                    Photos
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-1.5 md:gap-2 px-3 md:px-4 text-xs md:text-sm whitespace-nowrap">
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Project Info Tab */}
              <TabsContent value="project-info">
                <EstimateProjectInfo
                  data={projectInfo}
                  onUpdate={updateProjectInfo}
                  leadData={leadData}
                />
              </TabsContent>

              {/* Line Items Tab */}
              <TabsContent value="line-items" className="space-y-4">
                {ESTIMATE_CATEGORIES.map(category => {
                  const items = getItemsByCategory(category);
                  // Only show categories with items or always show first few important ones
                  const showCategory = items.length > 0 || [
                    "Design/Planning",
                    "General Conditions", 
                    "Demo",
                    "Foundation",
                    "Framing"
                  ].includes(category);
                  
                  if (!showCategory) return null;
                  
                  return (
                    <EstimateCategorySection
                      key={category}
                      category={category}
                      items={items}
                      onUpdateItem={updateLineItem}
                      onRemoveItem={removeLineItem}
                      onAddItem={addLineItem}
                      defaultExpanded={items.length > 0}
                    />
                  );
                })}
              </TabsContent>

              {/* Pricing Guide Tab */}
              <TabsContent value="pricing-guide">
                <Card>
                  <CardHeader className="pb-3 md:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Search className="h-4 w-4 md:h-5 md:w-5" />
                      Pricing Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PricingGuideSearch onAddItem={addFromPricingGuide} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos">
                <Card>
                  <CardHeader className="pb-3 md:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Camera className="h-4 w-4 md:h-5 md:w-5" />
                      Project Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 md:p-12 text-center">
                      <Camera className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-sm md:text-base text-muted-foreground">
                        Drag and drop photos here, or click to upload
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2">
                        Photos from walkthrough will appear here
                      </p>
                      <Button variant="outline" className="mt-4">
                        Upload Photos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes">
                <EstimateNotesTab
                  data={notes}
                  onUpdate={updateNotes}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Summary Panel - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <EstimateSummaryCard
              materialsCost={totals.materialsCost}
              laborCost={totals.laborCost}
              permitsFees={permitsFees}
              contingency={contingency}
              markupMultiplier={markupMultiplier}
              onMarkupChange={setMarkupMultiplier}
              onPermitsChange={setPermitsFees}
              onContingencyChange={setContingency}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t shadow-lg z-40">
        <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
          <SheetTrigger asChild>
            <button className="w-full px-4 py-3 flex items-center justify-between active:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Grand Total</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Estimate Summary
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-full pb-8">
              <EstimateSummaryCard
                materialsCost={totals.materialsCost}
                laborCost={totals.laborCost}
                permitsFees={permitsFees}
                contingency={contingency}
                markupMultiplier={markupMultiplier}
                onMarkupChange={setMarkupMultiplier}
                onPermitsChange={setPermitsFees}
                onContingencyChange={setContingency}
                isMobileSheet
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

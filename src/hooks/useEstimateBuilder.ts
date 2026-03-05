import { useState, useCallback, useMemo } from "react";
import { LineItemData } from "@/components/estimates/EstimateLineItem";

interface ProjectInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceAddress: string;
  serviceCity: string;
  serviceState: string;
  serviceZip: string;
  isGatedProperty: boolean;
  projectCategory: string;
  projectDescription: string;
  requestedDate: string;
  status: string;
  referralSource: string;
  opportunityRating: number;
  assignedEstimator: string;
  estimateNumber: string;
}

interface NotesData {
  customerNotes: string;
  internalNotes: string;
  termsAndConditions: string;
}

// Estimate categories in order
export const ESTIMATE_CATEGORIES = [
  "Design/Planning",
  "General Conditions",
  "Dumpster",
  "Demo",
  "Foundation",
  "Framing",
  "Roofing",
  "Siding",
  "Gutters",
  "Masonry",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Insulation",
  "Drywall",
  "Flooring",
  "Doors",
  "Carpentry",
  "Painting",
  "Deck",
  "Cabinets",
  "Counter Tops",
  "Tile",
  "Windows",
];

export function useEstimateBuilder(leadData?: any) {
  // Line items state
  const [lineItems, setLineItems] = useState<LineItemData[]>([]);
  
  // Project info state
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    customerName: leadData?.name || "",
    customerEmail: leadData?.email || "",
    customerPhone: leadData?.phone || "",
    serviceAddress: "",
    serviceCity: "",
    serviceState: "NJ",
    serviceZip: "",
    isGatedProperty: false,
    projectCategory: leadData?.project_type || "",
    projectDescription: leadData?.client_notes || "",
    requestedDate: "",
    status: "draft",
    referralSource: leadData?.referral_source || "",
    opportunityRating: 3,
    assignedEstimator: "",
    estimateNumber: `EST-${Date.now()}`,
  });
  
  // Notes state
  const [notes, setNotes] = useState<NotesData>({
    customerNotes: "",
    internalNotes: "",
    termsAndConditions: "",
  });
  
  // Pricing state
  const [permitsFees, setPermitsFees] = useState(0);
  const [contingency, setContingency] = useState(0);
  const [markupMultiplier, setMarkupMultiplier] = useState("2.00");

  // Generate unique ID for line items
  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a new line item
  const addLineItem = useCallback((category: string, itemData?: Partial<LineItemData>) => {
    const newItem: LineItemData = {
      id: generateId(),
      description: itemData?.description || "",
      quantity: itemData?.quantity || 1,
      unit: itemData?.unit || "UNIT",
      materialCost: itemData?.materialCost || 0,
      laborCost: itemData?.laborCost || 0,
      totalCost: itemData?.totalCost || ((itemData?.materialCost || 0) + (itemData?.laborCost || 0)) * (itemData?.quantity || 1),
      category: category,
      pricingGuideId: itemData?.pricingGuideId,
      notes: itemData?.notes,
    };
    
    setLineItems(prev => [...prev, newItem]);
    return newItem.id;
  }, []);

  // Update a line item
  const updateLineItem = useCallback((id: string, field: keyof LineItemData, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Auto-recalculate total when costs or quantity change
      if (field === 'materialCost' || field === 'laborCost' || field === 'quantity') {
        updated.totalCost = (updated.materialCost + updated.laborCost) * updated.quantity;
      }
      
      return updated;
    }));
  }, []);

  // Remove a line item
  const removeLineItem = useCallback((id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Update project info
  const updateProjectInfo = useCallback((field: keyof ProjectInfo, value: any) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update notes
  const updateNotes = useCallback((field: keyof NotesData, value: string) => {
    setNotes(prev => ({ ...prev, [field]: value }));
  }, []);

  // Get items by category
  const getItemsByCategory = useCallback((category: string) => {
    return lineItems.filter(item => item.category === category);
  }, [lineItems]);

  // Calculate totals
  const totals = useMemo(() => {
    const materialsCost = lineItems.reduce((sum, item) => sum + (item.materialCost * item.quantity), 0);
    const laborCost = lineItems.reduce((sum, item) => sum + (item.laborCost * item.quantity), 0);
    const subtotal = materialsCost + laborCost + permitsFees + contingency;
    const multiplier = parseFloat(markupMultiplier) || 1;
    const salePrice = subtotal * multiplier;
    const taxRate = 6.625; // NJ tax
    const taxAmount = (salePrice * taxRate) / 100;
    const grandTotal = salePrice + taxAmount;
    const grossProfit = salePrice - subtotal;
    const grossProfitPercent = subtotal > 0 ? ((grossProfit / salePrice) * 100) : 0;

    return {
      materialsCost,
      laborCost,
      subtotal,
      salePrice,
      taxAmount,
      grandTotal,
      grossProfit,
      grossProfitPercent,
    };
  }, [lineItems, permitsFees, contingency, markupMultiplier]);

  // Categories with items
  const categoriesWithItems = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    lineItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    return categoryCounts;
  }, [lineItems]);

  // Add item from pricing guide
  const addFromPricingGuide = useCallback((item: Partial<LineItemData>) => {
    const category = item.category || "General Conditions";
    return addLineItem(category, item);
  }, [addLineItem]);

  return {
    // State
    lineItems,
    projectInfo,
    notes,
    permitsFees,
    contingency,
    markupMultiplier,
    totals,
    categoriesWithItems,
    
    // Actions
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
    
    // Setters for bulk operations
    setLineItems,
    setProjectInfo,
    setNotes,
  };
}

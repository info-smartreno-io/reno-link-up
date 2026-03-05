import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, CheckCircle2, Building2, User, MapPin, Upload, X, FileText, Image as ImageIcon, Save } from "lucide-react";
import { z } from "zod";
import { SiteNavbar } from "@/components/SiteNavbar";

const stepSchemas = [
  z.object({
    companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
    contactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(100),
  }),
  z.object({
    email: z.string().trim().email("Invalid email address").max(255),
    phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20),
  }),
  z.object({
    productCategories: z.string().trim().min(3, "Please describe your services").max(500),
    serviceAreas: z.string().trim().min(3, "Please specify service areas").max(500),
  }),
  z.object({
    message: z.string().trim().max(2000).optional(),
    licenseFile: z.instanceof(File).optional(),
    insuranceFile: z.instanceof(File).optional(),
    portfolioFiles: z.array(z.instanceof(File)).optional(),
  }),
];

const AUTOSAVE_KEY = "contractor_application_draft";

export default function ContractorOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    productCategories: "",
    serviceAreas: "",
    message: "",
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [insurancePreview, setInsurancePreview] = useState<string | null>(null);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState<{
    license: boolean;
    insurance: boolean;
    portfolio: boolean;
  }>({ license: false, insurance: false, portfolio: false });

  const steps = [
    { title: "Company Info", icon: Building2, description: "Tell us about your company" },
    { title: "Contact Details", icon: User, description: "How can we reach you?" },
    { title: "Services & Areas", icon: MapPin, description: "What services do you offer?" },
    { title: "Additional Info", icon: FileText, description: "Anything else we should know?" },
  ];

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (licensePreview) URL.revokeObjectURL(licensePreview);
      if (insurancePreview) URL.revokeObjectURL(insurancePreview);
      portfolioPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [licensePreview, insurancePreview, portfolioPreviews]);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed.formData);
        setCurrentStep(parsed.currentStep || 0);
        
        toast({
          title: "Draft Restored",
          description: "Your previous application draft has been loaded.",
        });
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, []);

  // Autosave form data to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const draftData = {
        formData,
        currentStep,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(saveTimeout);
  }, [formData, currentStep]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (type: 'license' | 'insurance' | 'portfolio', files: FileList | null) => {
    if (!files) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = type === 'portfolio' 
      ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      : ['application/pdf', 'image/jpeg', 'image/png'];

    if (type === 'portfolio') {
      const validFiles = Array.from(files).filter(file => {
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          return false;
        }
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} must be an image or PDF`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      
      setPortfolioFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
      
      // Create preview URLs for images
      const newPreviews = validFiles
        .filter(file => file.type.startsWith('image/'))
        .map(file => URL.createObjectURL(file));
      setPortfolioPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
    } else {
      const file = files[0];
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "File must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "File must be PDF or image",
          variant: "destructive",
        });
        return;
      }

      if (type === 'license') {
        // Cleanup old preview
        if (licensePreview) URL.revokeObjectURL(licensePreview);
        setLicenseFile(file);
        if (file.type.startsWith('image/')) {
          setLicensePreview(URL.createObjectURL(file));
        } else {
          setLicensePreview(null);
        }
      } else {
        // Cleanup old preview
        if (insurancePreview) URL.revokeObjectURL(insurancePreview);
        setInsuranceFile(file);
        if (file.type.startsWith('image/')) {
          setInsurancePreview(URL.createObjectURL(file));
        } else {
          setInsurancePreview(null);
        }
      }
    }
  };

  const removePortfolioFile = (index: number) => {
    // Cleanup preview URL
    if (portfolioPreviews[index]) {
      URL.revokeObjectURL(portfolioPreviews[index]);
    }
    setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
    setPortfolioPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent, type: 'license' | 'insurance' | 'portfolio', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: active }));
  };

  const handleDrop = (e: React.DragEvent, type: 'license' | 'insurance' | 'portfolio') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(type, e.dataTransfer.files);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('applications')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data, error: urlError } = await supabase.storage
      .from('applications')
      .createSignedUrl(fileName, 3600);

    if (urlError || !data?.signedUrl) {
      throw urlError || new Error('Failed to create signed URL');
    }

    return data.signedUrl;
  };

  const validateCurrentStep = (): boolean => {
    try {
      const currentSchema = stepSchemas[currentStep];
      const dataToValidate = Object.keys(currentSchema.shape).reduce((acc, key) => {
        acc[key] = formData[key as keyof typeof formData];
        return acc;
      }, {} as any);
      
      currentSchema.parse(dataToValidate);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      // Upload files
      let licenseUrl: string | null = null;
      let insuranceUrl: string | null = null;
      const portfolioUrls: string[] = [];

      if (licenseFile) {
        licenseUrl = await uploadFile(licenseFile, 'contractor-applications/licenses');
      }
      if (insuranceFile) {
        insuranceUrl = await uploadFile(insuranceFile, 'contractor-applications/insurance');
      }
      if (portfolioFiles.length > 0) {
        for (const file of portfolioFiles) {
          const url = await uploadFile(file, 'contractor-applications/portfolio');
          if (url) portfolioUrls.push(url);
        }
      }

      const { data, error } = await supabase
        .from("vendor_applications")
        .insert({
          company_name: formData.companyName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          product_categories: formData.productCategories,
          service_areas: formData.serviceAreas,
          message: formData.message || null,
          license_url: licenseUrl,
          insurance_url: insuranceUrl,
          portfolio_urls: portfolioUrls.length > 0 ? portfolioUrls : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Clear the saved draft after successful submission
      localStorage.removeItem(AUTOSAVE_KEY);

      // Generate tracking number from application ID
      const trackingNumber = `SR-${data.id.substring(0, 8).toUpperCase()}`;

      // Send confirmation email in the background
      try {
        await supabase.functions.invoke('send-contractor-confirmation', {
          body: {
            email: formData.email,
            companyName: formData.companyName,
            contactName: formData.contactName,
            trackingNumber,
          },
        });
        console.log("Confirmation email sent successfully");
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't block the user flow if email fails
      }

      // Send admin notification email
      try {
        await supabase.functions.invoke('send-admin-contractor-notification', {
          body: {
            companyName: formData.companyName,
            contactName: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            trackingNumber,
            productCategories: formData.productCategories,
            serviceAreas: formData.serviceAreas,
            hasLicense: !!licenseUrl,
            hasInsurance: !!insuranceUrl,
            portfolioCount: portfolioUrls.length,
          },
        });
        console.log("Admin notification sent successfully");
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
        // Don't block the user flow if email fails
      }

      // Navigate to confirmation page with tracking info
      navigate(`/contractors/confirmation?tracking=${trackingNumber}&company=${encodeURIComponent(formData.companyName)}`);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />
      
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/contractors")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contractors
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Join the SmartReno Network</h1>
          <p className="text-muted-foreground text-lg">
            Complete the application to start receiving qualified leads
          </p>
          {lastSaved && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Save className="h-4 w-4" />
              <span>Draft saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col items-center flex-1 ${
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-center hidden sm:block">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Company Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., On The Spot Home Improvements"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">
                    Contact Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    placeholder="e.g., John Smith"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Contact Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@yourcompany.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(201) 555-1212"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Services & Areas */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productCategories">
                    Services Offered <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="productCategories"
                    placeholder="e.g., Kitchen remodeling, bathroom renovations, basement finishing, general contracting..."
                    value={formData.productCategories}
                    onChange={(e) => handleInputChange("productCategories", e.target.value)}
                    className="mt-1 min-h-24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    List the types of renovation and remodeling services you provide
                  </p>
                </div>
                <div>
                  <Label htmlFor="serviceAreas">
                    Service Areas <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="serviceAreas"
                    placeholder="e.g., Bergen County, Passaic County, Morris County, Northern New Jersey..."
                    value={formData.serviceAreas}
                    onChange={(e) => handleInputChange("serviceAreas", e.target.value)}
                    className="mt-1 min-h-20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Which counties or regions do you serve?
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Additional Info & Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="message">Additional Information (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your company's experience, certifications, or anything else you'd like us to know..."
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    className="mt-1 min-h-24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include years in business, team size, certifications, or specialties
                  </p>
                </div>

                {/* License Upload */}
                <div>
                  <Label htmlFor="license">
                    Business License (Optional)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="license"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('license', e.target.files)}
                      className="hidden"
                    />
                    {licenseFile ? (
                      <div className="space-y-2">
                        {licensePreview ? (
                          <div className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-border">
                            <img
                              src={licensePreview}
                              alt="License preview"
                              className="w-full h-full object-contain bg-muted"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-sm flex-1">{licenseFile.name}</span>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (licensePreview) URL.revokeObjectURL(licensePreview);
                            setLicenseFile(null);
                            setLicensePreview(null);
                          }}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="license"
                        onDragEnter={(e) => handleDrag(e, 'license', true)}
                        onDragLeave={(e) => handleDrag(e, 'license', false)}
                        onDragOver={(e) => handleDrag(e, 'license', true)}
                        onDrop={(e) => handleDrop(e, 'license')}
                        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
                          dragActive.license 
                            ? 'border-primary bg-primary/10 scale-105' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Upload className={`h-6 w-6 transition-colors ${dragActive.license ? 'text-primary' : ''}`} />
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {dragActive.license ? 'Drop file here' : 'Click to upload or drag & drop'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF or Image, max 10MB
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Insurance Upload */}
                <div>
                  <Label htmlFor="insurance">
                    Insurance Certificate (Optional)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="insurance"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('insurance', e.target.files)}
                      className="hidden"
                    />
                    {insuranceFile ? (
                      <div className="space-y-2">
                        {insurancePreview ? (
                          <div className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-border">
                            <img
                              src={insurancePreview}
                              alt="Insurance preview"
                              className="w-full h-full object-contain bg-muted"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-sm flex-1">{insuranceFile.name}</span>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (insurancePreview) URL.revokeObjectURL(insurancePreview);
                            setInsuranceFile(null);
                            setInsurancePreview(null);
                          }}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="insurance"
                        onDragEnter={(e) => handleDrag(e, 'insurance', true)}
                        onDragLeave={(e) => handleDrag(e, 'insurance', false)}
                        onDragOver={(e) => handleDrag(e, 'insurance', true)}
                        onDrop={(e) => handleDrop(e, 'insurance')}
                        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
                          dragActive.insurance 
                            ? 'border-primary bg-primary/10 scale-105' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Upload className={`h-6 w-6 transition-colors ${dragActive.insurance ? 'text-primary' : ''}`} />
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {dragActive.insurance ? 'Drop file here' : 'Click to upload or drag & drop'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF or Image, max 10MB
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Portfolio Upload */}
                <div>
                  <Label htmlFor="portfolio">
                    Portfolio Images (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload up to 5 images of your work
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Input
                        id="portfolio"
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={(e) => handleFileChange('portfolio', e.target.files)}
                        className="hidden"
                        disabled={portfolioFiles.length >= 5}
                      />
                      <label
                        htmlFor="portfolio"
                        onDragEnter={(e) => handleDrag(e, 'portfolio', true)}
                        onDragLeave={(e) => handleDrag(e, 'portfolio', false)}
                        onDragOver={(e) => handleDrag(e, 'portfolio', true)}
                        onDrop={(e) => handleDrop(e, 'portfolio')}
                        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
                          portfolioFiles.length >= 5 
                            ? 'opacity-50 cursor-not-allowed border-border' 
                            : dragActive.portfolio 
                            ? 'border-primary bg-primary/10 scale-105' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Upload className={`h-6 w-6 transition-colors ${dragActive.portfolio ? 'text-primary' : ''}`} />
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {portfolioFiles.length >= 5 
                              ? 'Maximum 5 files reached'
                              : dragActive.portfolio 
                              ? 'Drop images here' 
                              : 'Click to upload or drag & drop'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {portfolioFiles.length >= 5 
                              ? 'Remove a file to upload more' 
                              : `Images or PDF (${portfolioFiles.length}/5), max 10MB each`}
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {portfolioFiles.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {portfolioFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            {portfolioPreviews[index] ? (
                              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                                <img
                                  src={portfolioPreviews[index]}
                                  alt={`Portfolio ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removePortfolioFile(index)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted flex flex-col items-center justify-center p-2">
                                <FileText className="h-8 w-8 text-primary mb-1" />
                                <span className="text-xs text-center truncate w-full px-1">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePortfolioFile(index)}
                                  className="absolute top-1 right-1"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What happens next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ We'll review your application within 2-3 business days</li>
                    <li>✓ You'll receive an email with next steps</li>
                    <li>✓ Approved contractors get access to the platform and qualified leads</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trust Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Join {Math.floor(Math.random() * 50) + 50}+ vetted contractors in the SmartReno network
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <div className="font-bold text-2xl text-primary">Free</div>
              <div className="text-muted-foreground">to join</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-primary">3-5%</div>
              <div className="text-muted-foreground">transaction fee</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-primary">24hr</div>
              <div className="text-muted-foreground">avg response</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

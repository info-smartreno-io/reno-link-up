import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home, Camera, FileText, Settings2, Sparkles, Wrench, Plus, Upload, Edit, RefreshCw,
  AlertTriangle, CheckCircle2, Clock, HelpCircle, MapPin, Calendar, ChevronRight,
} from "lucide-react";
import {
  useHomeProfile, useHomeSystems, useHomePhotos, useHomeDocuments,
  useHomeInsights, useMaintenanceEvents, useGenerateHomeInsights,
  SYSTEM_TYPES, PHOTO_CATEGORIES,
} from "@/hooks/useHomeProfile";
import { MyHomeSetupWizard } from "@/components/homeowner/my-home/MyHomeSetupWizard";
import { UploadPhotoModal } from "@/components/homeowner/my-home/UploadPhotoModal";
import { UploadDocumentModal } from "@/components/homeowner/my-home/UploadDocumentModal";
import { AddSystemModal } from "@/components/homeowner/my-home/AddSystemModal";
import { formatDistanceToNow } from "date-fns";

const RISK_BADGE: Record<string, { variant: "destructive" | "default" | "secondary" | "outline"; icon: typeof AlertTriangle }> = {
  high: { variant: "destructive", icon: AlertTriangle },
  medium: { variant: "default", icon: Clock },
  low: { variant: "secondary", icon: CheckCircle2 },
  unknown: { variant: "outline", icon: HelpCircle },
};

const AI_BADGES: Record<string, string> = {
  high: "Likely Overdue",
  medium: "Monitor",
  low: "Healthy",
  unknown: "Insufficient Data",
};

export default function MyHomePage() {
  const { data: profile, isLoading } = useHomeProfile();
  const { data: systems } = useHomeSystems(profile?.id);
  const { data: photos } = useHomePhotos(profile?.id);
  const { data: documents } = useHomeDocuments(profile?.id);
  const { data: insights } = useHomeInsights(profile?.id);
  const { data: maintenance } = useMaintenanceEvents(profile?.id);
  const generateInsights = useGenerateHomeInsights();

  const [showWizard, setShowWizard] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (!profile && !showWizard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-lg w-full border-dashed border-2 border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Welcome to My Home</h2>
            <p className="text-sm text-muted-foreground">
              Create a digital profile of your property. Track systems, upload documents, and get AI-powered maintenance recommendations.
            </p>
            <ul className="text-sm text-muted-foreground text-left space-y-2 max-w-sm mx-auto">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> Track major home systems & their condition</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> Store inspection reports & warranties</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> Get smart maintenance recommendations</li>
            </ul>
            <Button size="lg" className="mt-2 gap-2" onClick={() => setShowWizard(true)}>
              <Home className="h-4 w-4" /> Set Up My Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showWizard) {
    return <MyHomeSetupWizard onComplete={() => setShowWizard(false)} />;
  }

  const systemLabel = (type: string) => SYSTEM_TYPES.find(s => s.value === type)?.label || type;
  const categoryLabel = (cat: string) => PHOTO_CATEGORIES.find(c => c.value === cat)?.label || cat;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Home</h1>
          <p className="text-sm text-muted-foreground">Track your home's systems, documents, and maintenance history.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowPhotoModal(true)}>
            <Camera className="h-4 w-4 mr-1" /> Upload Photos
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDocModal(true)}>
            <FileText className="h-4 w-4 mr-1" /> Upload Documents
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit Home Info
          </Button>
        </div>
      </div>

      {/* Property Snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Property Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Address</span><p className="font-medium">{profile?.property_address || "—"}</p></div>
            <div><span className="text-muted-foreground">Year Built</span><p className="font-medium">{profile?.year_built || "Unknown"}</p></div>
            <div><span className="text-muted-foreground">Sq Ft</span><p className="font-medium">{profile?.square_footage?.toLocaleString() || "Unknown"}</p></div>
            <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{profile?.home_type?.replace(/_/g, " ") || "Unknown"}</p></div>
            <div><span className="text-muted-foreground">Bedrooms</span><p className="font-medium">{profile?.bedrooms || "—"}</p></div>
            <div><span className="text-muted-foreground">Bathrooms</span><p className="font-medium">{profile?.bathrooms || "—"}</p></div>
            <div><span className="text-muted-foreground">Floors</span><p className="font-medium">{profile?.floors || "—"}</p></div>
            <div><span className="text-muted-foreground">Heating</span><p className="font-medium capitalize">{profile?.heat_fuel_type?.replace(/_/g, " ") || "—"}</p></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="systems" className="space-y-4">
        <TabsList>
          <TabsTrigger value="systems"><Settings2 className="h-4 w-4 mr-1" /> Systems</TabsTrigger>
          <TabsTrigger value="photos"><Camera className="h-4 w-4 mr-1" /> Photos</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-1" /> Documents</TabsTrigger>
          <TabsTrigger value="insights"><Sparkles className="h-4 w-4 mr-1" /> AI Insights</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-1" /> Maintenance</TabsTrigger>
        </TabsList>

        {/* Systems Tab */}
        <TabsContent value="systems" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{systems?.length || 0} systems tracked</p>
            <Button size="sm" onClick={() => setShowSystemModal(true)}><Plus className="h-4 w-4 mr-1" /> Add System</Button>
          </div>
          {systems?.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">No systems tracked yet. Add your first home system to get started.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {systems?.map(sys => {
                const riskInfo = RISK_BADGE[sys.ai_risk_level || "unknown"] || RISK_BADGE.unknown;
                const RiskIcon = riskInfo.icon;
                return (
                  <Card key={sys.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{systemLabel(sys.system_type)}</h3>
                            {sys.ai_risk_level && (
                              <Badge variant={riskInfo.variant} className="text-[10px] px-1.5 h-5">
                                <RiskIcon className="h-3 w-3 mr-0.5" />
                                {AI_BADGES[sys.ai_risk_level] || sys.ai_risk_level}
                              </Badge>
                            )}
                          </div>
                          {sys.brand && <p className="text-xs text-muted-foreground mt-0.5">{sys.brand} {sys.model_number || ""}</p>}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {sys.install_year && <span>Installed: {sys.install_year}</span>}
                            {sys.condition_rating && <span className="capitalize">Condition: {sys.condition_rating}</span>}
                          </div>
                          {sys.ai_recommendation && (
                            <p className="text-xs mt-2 text-foreground bg-muted/50 rounded p-2">{sys.ai_recommendation}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{photos?.length || 0} photos</p>
            <Button size="sm" onClick={() => setShowPhotoModal(true)}><Upload className="h-4 w-4 mr-1" /> Upload Photo</Button>
          </div>
          {photos?.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">No photos uploaded yet.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos?.map(photo => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    <img src={photo.file_url} alt={photo.caption || photo.category} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate">{categoryLabel(photo.category)}</p>
                    {photo.caption && <p className="text-xs text-muted-foreground truncate">{photo.caption}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{documents?.length || 0} documents</p>
            <Button size="sm" onClick={() => setShowDocModal(true)}><Upload className="h-4 w-4 mr-1" /> Upload Document</Button>
          </div>
          {documents?.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">No documents uploaded yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {documents?.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{doc.document_type.replace(/_/g, " ")}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{insights?.length || 0} active insights</p>
            <Button
              size="sm"
              onClick={() => profile && generateInsights.mutate(profile.id)}
              disabled={generateInsights.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${generateInsights.isPending ? "animate-spin" : ""}`} />
              {generateInsights.isPending ? "Generating..." : "Generate Insights"}
            </Button>
          </div>
          {insights?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No AI insights yet. Add some home systems and click "Generate Insights" to get recommendations.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {insights?.map(insight => {
                const riskInfo = RISK_BADGE[insight.risk_level || "unknown"] || RISK_BADGE.unknown;
                const RiskIcon = riskInfo.icon;
                return (
                  <Card key={insight.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RiskIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          insight.risk_level === "high" ? "text-destructive" : insight.risk_level === "medium" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{insight.title}</h3>
                            <Badge variant={riskInfo.variant} className="text-[10px]">{insight.risk_level}</Badge>
                            <Badge variant="outline" className="text-[10px]">{insight.confidence_level} confidence</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                          {insight.recommendation && (
                            <p className="text-sm mt-2 bg-muted/50 rounded p-2"><strong>Recommendation:</strong> {insight.recommendation}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground italic">
            SmartReno recommendations are informational only and based on homeowner-provided information, uploaded documents, and general product lifespan guidance. They are not a substitute for an in-person inspection by a qualified professional.
          </p>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{maintenance?.length || 0} events recorded</p>
          </div>
          {maintenance?.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">No maintenance history recorded yet.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {maintenance?.map(event => (
                <Card key={event.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{event.event_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.event_date || "No date"} {event.vendor_name && `· ${event.vendor_name}`} {event.cost && `· $${Number(event.cost).toLocaleString()}`}
                      </p>
                      {event.notes && <p className="text-xs text-muted-foreground mt-0.5">{event.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showPhotoModal && profile && <UploadPhotoModal profileId={profile.id} onClose={() => setShowPhotoModal(false)} />}
      {showDocModal && profile && <UploadDocumentModal profileId={profile.id} onClose={() => setShowDocModal(false)} />}
      {showSystemModal && profile && <AddSystemModal profileId={profile.id} onClose={() => setShowSystemModal(false)} />}
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  FileText, 
  ClipboardCheck,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface PermitAdvisorPanelProps {
  projectId?: string;
  scope?: any;
  projectAddress?: string;
  municipality?: string;
  workTypes?: string[];
  photos?: any[];
}

export function PermitAdvisorPanel({ 
  projectId = '', 
  scope = {}, 
  projectAddress = '', 
  municipality = '', 
  workTypes = [], 
  photos = [] 
}: PermitAdvisorPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [permitReport, setPermitReport] = useState<any>(null);

  const handleAnalyzePermits = async () => {
    if (!municipality && !projectId) {
      toast.error('Municipality or project information is required for permit analysis');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-permit-advisor', {
        body: {
          projectId,
          scope,
          projectAddress,
          municipality,
          workTypes,
          photos
        }
      });

      if (error) throw error;

      setPermitReport(data);
      
      const permitCount = data.required_permits?.length || 0;
      const missingDocs = data.missing_documents?.length || 0;
      
      toast.success(`Analysis Complete: ${permitCount} permits required, ${missingDocs} missing documents`);
    } catch (error: any) {
      console.error('Error analyzing permits:', error);
      toast.error(error.message || 'Failed to analyze permits');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Permit Requirements (AI)</CardTitle>
          </div>
          <Button 
            onClick={handleAnalyzePermits} 
            disabled={analyzing || !municipality}
            variant={permitReport ? "outline" : "default"}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {analyzing ? 'Analyzing...' : permitReport ? 'Re-analyze' : 'Analyze Permit Requirements (AI)'}
          </Button>
        </div>
        <CardDescription>
          AI-powered analysis of required NJ permits, forms, and documentation
        </CardDescription>
      </CardHeader>

      {permitReport && (
        <CardContent className="space-y-6">
          {/* Required Permits */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Required Permits</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {permitReport.required_permits?.map((permit: string, idx: number) => (
                <Badge key={idx} variant="default">
                  {permit}
                </Badge>
              ))}
            </div>
          </div>

          {/* Required Forms */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Required Forms</h3>
            </div>
            <ul className="space-y-2">
              {permitReport.required_forms?.map((form: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {form}
                </li>
              ))}
            </ul>
          </div>

          {/* Inspection Sequence */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Inspection Schedule</h3>
            </div>
            <div className="space-y-2">
              {permitReport.inspection_sequence?.map((inspection: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{inspection.phase}</p>
                      <p className="text-xs text-muted-foreground">{inspection.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      ~Day {inspection.typically_days_after_start}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Documents */}
          {permitReport.missing_documents?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Missing Documents</h3>
              </div>
              <div className="space-y-2">
                {permitReport.missing_documents.map((doc: string, idx: number) => (
                  <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm">⚠️ {doc}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3">
                Request from Homeowner
              </Button>
            </div>
          )}

          {/* Municipality Contact */}
          {permitReport.municipality_contact && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-3">{permitReport.municipality_contact.name || municipality} Building Department</h3>
              
              {permitReport.municipality_contact.email && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${permitReport.municipality_contact.email}`} className="hover:underline">
                    {permitReport.municipality_contact.email}
                  </a>
                </div>
              )}
              
              {permitReport.municipality_contact.phone && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${permitReport.municipality_contact.phone}`} className="hover:underline">
                    {permitReport.municipality_contact.phone}
                  </a>
                </div>
              )}
              
              {permitReport.municipality_contact.forms_url && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href={permitReport.municipality_contact.forms_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Download Forms
                  </a>
                </div>
              )}

              {permitReport.municipality_notes && (
                <p className="text-sm text-muted-foreground mt-3">
                  {permitReport.municipality_notes}
                </p>
              )}

              {permitReport.estimated_approval_days && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm">
                    <span className="font-medium">Estimated Approval Time:</span>{' '}
                    {permitReport.estimated_approval_days} days
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

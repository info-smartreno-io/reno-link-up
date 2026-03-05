import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare,
  UserCheck,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface WarrantyClassifierPanelProps {
  warrantyId?: string;
  projectId?: string;
  description?: string;
  photos?: any[];
  contractorId?: string;
  projectScope?: any;
  timeline?: any[];
  tradeInvolved?: string;
}

export function WarrantyClassifierPanel({ 
  warrantyId = '', 
  projectId = '', 
  description = '', 
  photos = [], 
  contractorId = '', 
  projectScope = {}, 
  timeline = [], 
  tradeInvolved = '' 
}: WarrantyClassifierPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [classification, setClassification] = useState<any>(null);
  const [editedHomeownerMsg, setEditedHomeownerMsg] = useState('');
  const [editedContractorMsg, setEditedContractorMsg] = useState('');

  const handleAnalyze = async () => {
    if (!description && !warrantyId) {
      toast.error('Warranty description or ID is required');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-warranty-classifier', {
        body: {
          warrantyId,
          projectId,
          description,
          photos,
          contractorId,
          projectScope,
          timeline,
          tradeInvolved,
        },
      });

      if (error) throw error;

      setClassification(data);
      setEditedHomeownerMsg(data.message_homeowner || '');
      setEditedContractorMsg(data.message_contractor || '');
      toast.success('Warranty claim analyzed');
    } catch (error) {
      console.error('Error analyzing warranty:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze warranty claim');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      low: { variant: "secondary", icon: CheckCircle2 },
      medium: { variant: "default", icon: Info },
      high: { variant: "destructive", icon: AlertTriangle },
    };
    const config = variants[severity] || variants.medium;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Warranty Classification
            </CardTitle>
            <CardDescription>
              Analyze warranty claims for category, severity, and routing
            </CardDescription>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="gap-2"
          >
            {analyzing ? (
              <>Analyzing...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Warranty Claim (AI)
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {classification && (
        <CardContent className="space-y-6">
          {/* Classification Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Category</div>
              <Badge variant="outline" className="capitalize">
                {classification.category}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Severity</div>
              {getSeverityBadge(classification.severity)}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Responsible Party</div>
              <Badge variant="outline" className="capitalize">
                <UserCheck className="h-3 w-3 mr-1" />
                {classification.responsible_party?.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Recommended Action</div>
              <Badge className="capitalize">
                {classification.recommended_action?.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          {/* Reasoning */}
          {classification.reasoning && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">AI Reasoning</div>
              <p className="text-sm text-muted-foreground">{classification.reasoning}</p>
            </div>
          )}

          {/* Message Templates */}
          <Tabs defaultValue="homeowner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="homeowner">
                <MessageSquare className="h-4 w-4 mr-2" />
                Homeowner Message
              </TabsTrigger>
              <TabsTrigger value="contractor">
                <UserCheck className="h-4 w-4 mr-2" />
                Contractor Message
              </TabsTrigger>
            </TabsList>

            <TabsContent value="homeowner" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message to Homeowner (Editable)</label>
                <Textarea
                  value={editedHomeownerMsg}
                  onChange={(e) => setEditedHomeownerMsg(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="contractor" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message to Contractor (Editable)</label>
                <Textarea
                  value={editedContractorMsg}
                  onChange={(e) => setEditedContractorMsg(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              className="flex-1"
              onClick={() => toast.info('Routing applied (demo)')}
            >
              Apply Routing
            </Button>
            {classification.needs_more_info && (
              <Button 
                variant="outline"
                onClick={() => toast.info('Requested more info (demo)')}
              >
                Request More Info
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

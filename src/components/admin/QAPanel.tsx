import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  FileWarning,
  Clock,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface QAPanelProps {
  projectId?: string;
  scope?: any;
  estimate?: any[];
  timeline?: any[];
  rfps?: any[];
  bids?: any[];
  messages?: any[];
  photos?: any[];
}

export function QAPanel({ 
  projectId = '', 
  scope = {}, 
  estimate = [], 
  timeline = [], 
  rfps = [], 
  bids = [], 
  messages = [], 
  photos = [] 
}: QAPanelProps) {
  const [running, setRunning] = useState(false);
  const [qaReport, setQaReport] = useState<any>(null);
  const [resolvedIssues, setResolvedIssues] = useState<Set<number>>(new Set());

  const handleRunQA = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-qa-audit', {
        body: {
          projectId,
          scope,
          estimate,
          timeline,
          rfps,
          bids,
          messages,
          photos
        }
      });

      if (error) throw error;

      setQaReport(data);
      setResolvedIssues(new Set());
      
      const issueCount = data.issues?.length || 0;
      const riskLevel = data.risk_score || 'unknown';
      
      toast.success(`QA Check Complete: ${issueCount} issues found (${riskLevel} risk)`);
    } catch (error: any) {
      console.error('Error running QA:', error);
      toast.error(error.message || 'Failed to run QA check');
    } finally {
      setRunning(false);
    }
  };

  const toggleResolved = (index: number) => {
    const newResolved = new Set(resolvedIssues);
    if (newResolved.has(index)) {
      newResolved.delete(index);
    } else {
      newResolved.add(index);
    }
    setResolvedIssues(newResolved);
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <FileWarning className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI QA Report</CardTitle>
          </div>
          <Button 
            onClick={handleRunQA} 
            disabled={running}
            variant={qaReport ? "outline" : "default"}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {running ? 'Running QA...' : qaReport ? 'Re-run QA Check' : 'Run QA Check (AI)'}
          </Button>
        </div>
        <CardDescription>
          Automated quality assurance scan for errors, inconsistencies, and risks
        </CardDescription>
      </CardHeader>

      {qaReport && (
        <CardContent>
          {/* Risk Score Header */}
          <div className="mb-6 p-4 bg-muted rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Risk Score</p>
              <div className="flex items-center gap-2">
                <Badge variant={getRiskBadgeVariant(qaReport.risk_score)} className="text-lg px-3 py-1">
                  {qaReport.risk_score?.toUpperCase() || 'UNKNOWN'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {qaReport.issues?.length || 0} issues found
                </span>
              </div>
            </div>
            <TrendingUp className={`h-8 w-8 ${
              qaReport.risk_score === 'high' ? 'text-destructive' :
              qaReport.risk_score === 'medium' ? 'text-yellow-500' :
              'text-green-500'
            }`} />
          </div>

          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="issues">
                Issues ({qaReport.issues?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="disclaimers">
                Disclaimers ({qaReport.disclaimer_warnings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="timeline">
                Timeline ({qaReport.timeline_warnings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="bids">
                Bids ({qaReport.bid_mismatches?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-2 mt-4">
              {qaReport.issues?.length > 0 ? (
                qaReport.issues.map((issue: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      resolvedIssues.has(idx) 
                        ? 'bg-muted/50 opacity-60' 
                        : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm font-medium ${resolvedIssues.has(idx) ? 'line-through' : ''}`}>
                              {issue.text}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {issue.type.replace(/_/g, ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {issue.location}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleResolved(idx)}
                          >
                            {resolvedIssues.has(idx) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No issues found</p>
                </div>
              )}

              {qaReport.recommended_fixes?.length > 0 && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-medium text-sm mb-2">Recommended Fixes</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {qaReport.recommended_fixes.map((fix: string, idx: number) => (
                      <li key={idx}>• {fix}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="disclaimers" className="space-y-2 mt-4">
              {qaReport.disclaimer_warnings?.length > 0 ? (
                qaReport.disclaimer_warnings.map((warning: string, idx: number) => (
                  <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm">⚠️ {warning}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All disclaimers present</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-2 mt-4">
              {qaReport.timeline_warnings?.length > 0 ? (
                qaReport.timeline_warnings.map((warning: string, idx: number) => (
                  <div key={idx} className="p-3 bg-background rounded-lg border">
                    <p className="text-sm">{warning}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Timeline looks good</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bids" className="space-y-2 mt-4">
              {qaReport.bid_mismatches?.length > 0 ? (
                qaReport.bid_mismatches.map((mismatch: string, idx: number) => (
                  <div key={idx} className="p-3 bg-background rounded-lg border">
                    <p className="text-sm">{mismatch}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All bids match scope</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

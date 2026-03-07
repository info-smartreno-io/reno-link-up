import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BidMessaging } from "@/components/bid/BidMessaging";
import { BidBuilderTable } from "@/components/contractor/BidBuilderTable";
import { Loader2, ArrowLeft, Calendar, DollarSign, MapPin, Building2, FileText, ExternalLink } from "lucide-react";

export default function ContractorRFPDetail() {
  const { rfpId } = useParams<{ rfpId: string }>();
  const navigate = useNavigate();

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["rfp-detail", rfpId],
    enabled: !!rfpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_opportunities")
        .select("*")
        .eq("id", rfpId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: scopeItems } = useQuery({
    queryKey: ["rfp-scope-items", rfpId],
    enabled: !!rfpId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("rfp_scope_items")
        .select("*")
        .eq("bid_opportunity_id", rfpId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (isLoading) {
    return (
      <ContractorLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ContractorLayout>
    );
  }

  if (!opportunity) {
    return (
      <ContractorLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Opportunity not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/contractor/opportunities")}>
            Back to Opportunities
          </Button>
        </div>
      </ContractorLayout>
    );
  }

  const isDeadlineSoon =
    Math.ceil((new Date(opportunity.bid_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3;

  const attachments = Array.isArray(opportunity.attachments) ? opportunity.attachments : [];

  return (
    <ContractorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/contractor/opportunities")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold">{opportunity.title}</h1>
            <p className="text-muted-foreground">{opportunity.project_type}</p>
          </div>
          {isDeadlineSoon && <Badge variant="destructive">Deadline Soon</Badge>}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scope">Scope of Work</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="bid-builder">Bid Builder</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {opportunity.location}
                  </div>
                  {opportunity.estimated_budget && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      ${opportunity.estimated_budget.toLocaleString()} estimated budget
                    </div>
                  )}
                  {opportunity.square_footage && (
                    <div className="flex items-center text-sm">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      {opportunity.square_footage.toLocaleString()} sq ft
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    Bid Deadline: {new Date(opportunity.bid_deadline).toLocaleDateString()}
                  </div>
                  {opportunity.deadline && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      Project Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {opportunity.description || "No description provided."}
                  </p>
                </CardContent>
              </Card>

              {opportunity.requirements && Array.isArray(opportunity.requirements) && (opportunity.requirements as any[]).length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {(opportunity.requirements as any[]).map((req: any, i: number) => (
                        <li key={i} className="flex items-start text-sm">
                          <span className="mr-2 text-muted-foreground">•</span>
                          {typeof req === "string" ? req : req.text || JSON.stringify(req)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Scope of Work */}
          <TabsContent value="scope" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scope of Work</CardTitle>
                <CardDescription>Line-item breakdown of project scope</CardDescription>
              </CardHeader>
              <CardContent>
                {!scopeItems || scopeItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No scope items have been added to this RFP yet.
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Est. Unit Price</TableHead>
                          <TableHead>Est. Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scopeItems.map((item: any, i: number) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{Number(item.quantity)}</TableCell>
                            <TableCell>${Number(item.estimated_unit_price).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">
                              ${(Number(item.quantity) * Number(item.estimated_unit_price)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents & Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No documents attached to this RFP.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att: any, i: number) => {
                      const url = typeof att === "string" ? att : att.url;
                      const name = typeof att === "string" ? `Attachment ${i + 1}` : att.name || `Attachment ${i + 1}`;
                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-md border hover:bg-muted transition-colors"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm flex-1">{name}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Messages</CardTitle>
                <CardDescription>Discuss this opportunity with the estimator</CardDescription>
              </CardHeader>
              <CardContent>
                <BidMessaging opportunityId={rfpId!} opportunityTitle={opportunity.title} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bid Builder */}
          <TabsContent value="bid-builder" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bid Builder</CardTitle>
                <CardDescription>
                  Build your itemized bid using your cost codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BidBuilderTable opportunityId={rfpId!} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ContractorLayout>
  );
}

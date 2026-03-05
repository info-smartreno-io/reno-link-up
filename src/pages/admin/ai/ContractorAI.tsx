import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Network, Globe, FileText, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContractorAI() {
  const [inputText, setInputText] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const extractedContractors = [
    {
      id: "1",
      source: "Angi Profile",
      businessName: "Elite Contractors NJ",
      contact: "555-0101",
      email: "info@elitecontractorsnj.com",
      license: "NJ-98765",
      trades: ["General Contractor", "Roofing"],
      rating: 4.8,
      status: "pending_review",
      extractedAt: "2024-01-15",
    },
    {
      id: "2",
      source: "Website Crawl",
      businessName: "ProBuild Solutions",
      contact: "555-0202",
      email: "contact@probuildsolutions.com",
      license: "NJ-54321",
      trades: ["General Contractor", "Kitchen Remodel"],
      rating: 4.5,
      status: "approved",
      extractedAt: "2024-01-14",
    },
  ];

  const bidAnalytics = [
    {
      id: "1",
      contractor: "Elite Contractors NJ",
      totalBids: 12,
      avgBidAmount: 45200,
      winRate: 41.7,
      avgResponseTime: "2.3 hours",
      qualityScore: 4.6,
    },
    {
      id: "2",
      contractor: "ProBuild Solutions",
      totalBids: 18,
      avgBidAmount: 38500,
      winRate: 33.3,
      avgResponseTime: "4.1 hours",
      qualityScore: 4.2,
    },
  ];

  const metrics = {
    totalExtracted: 47,
    pendingReview: 8,
    approved: 39,
    avgExtractionAccuracy: 94.2,
  };

  const handleExtract = () => {
    // Simulate AI extraction
    setExtractedData({
      businessName: "ABC Contracting Inc.",
      trades: ["General Contractor", "Plumbing"],
      contact: "555-123-4567",
      email: "contact@abccontracting.com",
      license: "NJ-12345",
      serviceAreas: ["Bergen County", "Essex County"],
      website: "www.abccontracting.com",
    });
    
    toast({
      title: "Data Extracted",
      description: "Review the extracted information before saving",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            Contractor & Network AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Build and maintain the contractor network using AI helpers
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Extracted</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.totalExtracted}
                <Users className="h-5 w-5 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.pendingReview}
                <Clock className="h-5 w-5 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.approved}
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Active in network</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Extraction Accuracy</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.avgExtractionAccuracy}%
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">AI accuracy</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="intake" className="w-full">
          <TabsList>
            <TabsTrigger value="intake">Data Intake Agent</TabsTrigger>
            <TabsTrigger value="extracted">Extracted Contractors</TabsTrigger>
            <TabsTrigger value="bid-prep">Bid Preparation Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="intake" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contractor Data Intake</CardTitle>
                <CardDescription>
                  Paste URLs, text, or profiles to extract contractor information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Input Data</label>
                  <Textarea
                    placeholder="Paste website URLs, Angi/Houzz/Yelp links, or raw text from brochures/emails..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button onClick={handleExtract} disabled={!inputText}>
                  <Globe className="h-4 w-4 mr-2" />
                  Extract Data
                </Button>

                {extractedData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Extracted Information</CardTitle>
                      <CardDescription>Review and edit before saving</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Business Name</p>
                          <p className="font-medium">{extractedData.businessName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">License</p>
                          <p className="font-medium">{extractedData.license}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contact</p>
                          <p className="font-medium">{extractedData.contact}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{extractedData.email}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Trades</p>
                          <p className="font-medium">{extractedData.trades.join(", ")}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Service Areas</p>
                          <p className="font-medium">{extractedData.serviceAreas.join(", ")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button>Save to Database</Button>
                        <Button variant="outline">Edit Details</Button>
                        <Button variant="ghost">Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extracted" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Contractors</CardTitle>
                <CardDescription>
                  Review and approve AI-extracted contractor information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search contractors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Trades</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Extracted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedContractors.map((contractor) => (
                      <TableRow key={contractor.id}>
                        <TableCell className="font-medium">{contractor.businessName}</TableCell>
                        <TableCell>{contractor.source}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {contractor.trades.slice(0, 2).map((trade, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {trade}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{contractor.license}</TableCell>
                        <TableCell>⭐ {contractor.rating}</TableCell>
                        <TableCell>
                          <Badge variant={contractor.status === "approved" ? "default" : "secondary"}>
                            {contractor.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contractor.extractedAt}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">View</Button>
                            {contractor.status === "pending_review" && (
                              <Button variant="ghost" size="sm">Approve</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bid-prep" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Bid Performance Analytics
                </CardTitle>
                <CardDescription>
                  AI-assisted bid analysis and pricing pattern insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Total Bids</TableHead>
                      <TableHead>Avg Bid Amount</TableHead>
                      <TableHead>Win Rate</TableHead>
                      <TableHead>Avg Response Time</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bidAnalytics.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium">{bid.contractor}</TableCell>
                        <TableCell>{bid.totalBids}</TableCell>
                        <TableCell>${bid.avgBidAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={bid.winRate > 40 ? "default" : "secondary"}>
                            {bid.winRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>{bid.avgResponseTime}</TableCell>
                        <TableCell>⭐ {bid.qualityScore}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

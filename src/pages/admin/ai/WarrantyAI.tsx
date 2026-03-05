import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertCircle, CheckCircle, TrendingUp, Clock, UserCheck } from "lucide-react";

export default function WarrantyAI() {
  const warrantyClaims = [
    {
      id: "1",
      claimNumber: "WC-2024-001",
      homeowner: "John Smith",
      project: "Kitchen Remodel",
      issue: "Water leak under kitchen sink",
      aiClassification: "Plumbing",
      severity: "high",
      warrantyStatus: "inside",
      suggestedContractor: "ABC Plumbing",
      estimatedCost: 450,
      submittedAt: "2024-01-15",
      aiConfidence: 96,
      needsReview: false,
    },
    {
      id: "2",
      claimNumber: "WC-2024-002",
      homeowner: "Jane Doe",
      project: "Living Room Paint",
      issue: "Paint peeling on ceiling",
      aiClassification: "Finish-level defect",
      severity: "medium",
      warrantyStatus: "needs_review",
      suggestedContractor: null,
      estimatedCost: 275,
      submittedAt: "2024-01-14",
      aiConfidence: 72,
      needsReview: true,
    },
    {
      id: "3",
      claimNumber: "WC-2024-003",
      homeowner: "Mike Johnson",
      project: "Bathroom Renovation",
      issue: "Cracked tile grout",
      aiClassification: "Tile/Grout",
      severity: "low",
      warrantyStatus: "inside",
      suggestedContractor: "Elite Tile Works",
      estimatedCost: 180,
      submittedAt: "2024-01-13",
      aiConfidence: 88,
      needsReview: false,
    },
  ];

  const routingHistory = [
    {
      id: "1",
      claimNumber: "WC-2024-001",
      contractor: "ABC Plumbing",
      routedAt: "2024-01-15",
      acceptedAt: "2024-01-15",
      status: "accepted",
    },
    {
      id: "2",
      claimNumber: "WC-2023-045",
      contractor: "Elite Tile Works",
      routedAt: "2024-01-10",
      acceptedAt: "2024-01-11",
      status: "completed",
    },
  ];

  const metrics = {
    totalClaims: 67,
    autoClassified: 58,
    avgAccuracy: 91.3,
    avgResponseTime: "3.2 hours",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Warranty AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Streamline warranty claim handling and triage
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Claims</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.totalClaims}
                <Shield className="h-5 w-5 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Auto-Classified</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.autoClassified}
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">High confidence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Classification Accuracy</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.avgAccuracy}%
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">AI accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Response Time</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.avgResponseTime}
                <Clock className="h-5 w-5 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">To routing</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="claims" className="w-full">
          <TabsList>
            <TabsTrigger value="claims">Smart Warranty Agent</TabsTrigger>
            <TabsTrigger value="routing">Routing History</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Warranty Claim Analysis</CardTitle>
                <CardDescription>
                  AI-powered claim classification and contractor routing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <TableHead>Homeowner</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Warranty</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warrantyClaims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>{claim.homeowner}</TableCell>
                        <TableCell className="text-sm">{claim.project}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {claim.issue}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{claim.aiClassification}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            claim.severity === "high" ? "destructive" :
                            claim.severity === "medium" ? "secondary" : "outline"
                          }>
                            {claim.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={claim.warrantyStatus === "inside" ? "default" : "secondary"}>
                            {claim.warrantyStatus.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {claim.suggestedContractor || "-"}
                        </TableCell>
                        <TableCell>${claim.estimatedCost}</TableCell>
                        <TableCell>
                          <Badge variant={claim.aiConfidence > 85 ? "default" : "secondary"}>
                            {claim.aiConfidence}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {claim.submittedAt}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">Route</Button>
                            <Button variant="ghost" size="sm">View</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Contractor Routing History
                </CardTitle>
                <CardDescription>
                  Track AI-suggested contractor assignments and outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim #</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Routed At</TableHead>
                      <TableHead>Accepted At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routingHistory.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.claimNumber}</TableCell>
                        <TableCell>{route.contractor}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {route.routedAt}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {route.acceptedAt}
                        </TableCell>
                        <TableCell>
                          <Badge variant={route.status === "completed" ? "default" : "secondary"}>
                            {route.status}
                          </Badge>
                        </TableCell>
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

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck, ExternalLink, Mail, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function PermitAI() {
  const permitRequirements = [
    {
      id: "1",
      project: "Kitchen Remodel - Johnson",
      homeowner: "Sarah Johnson",
      municipality: "Ridgewood, NJ",
      projectType: "Kitchen Remodel",
      requiredForms: ["Building Permit Application", "Electrical Permit", "Plumbing Permit"],
      estimatedFee: 450,
      avgProcessingTime: "14-21 days",
      status: "in_progress",
      aiConfidence: 95,
    },
    {
      id: "2",
      project: "Deck Construction - Davis",
      homeowner: "John Davis",
      municipality: "Glen Rock, NJ",
      projectType: "Deck Addition",
      requiredForms: ["Building Permit Application", "Zoning Compliance Form"],
      estimatedFee: 275,
      avgProcessingTime: "10-14 days",
      status: "pending",
      aiConfidence: 88,
    },
    {
      id: "3",
      project: "Bathroom Renovation - Smith",
      homeowner: "Mike Smith",
      municipality: "Fair Lawn, NJ",
      projectType: "Bathroom Remodel",
      requiredForms: ["Building Permit", "Plumbing Permit"],
      estimatedFee: 325,
      avgProcessingTime: "7-10 days",
      status: "submitted",
      aiConfidence: 92,
    },
  ];

  const complianceChecks = [
    {
      id: "1",
      project: "Kitchen Remodel - Johnson",
      checkType: "Zoning Compliance",
      result: "Passed",
      details: "Property zoning allows kitchen expansion",
      checkedAt: "2024-01-15",
    },
    {
      id: "2",
      project: "Deck Construction - Davis",
      checkType: "Setback Requirements",
      result: "Needs Review",
      details: "Deck within 10ft of property line - variance may be required",
      checkedAt: "2024-01-14",
    },
  ];

  const metrics = {
    totalPermits: 47,
    avgAccuracy: 93.5,
    timeSaved: "38 hours",
    autoApproved: 34,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCheck className="h-8 w-8" />
            Permit AI & Compliance
          </h1>
          <p className="text-muted-foreground mt-2">
            Help admins manage NJ permit requirements and compliance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Permits Analyzed</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.totalPermits}
                <FileCheck className="h-5 w-5 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>AI Accuracy</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.avgAccuracy}%
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Form identification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Time Saved</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.timeSaved}
                <Clock className="h-5 w-5 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Research time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Auto-Approved</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.autoApproved}
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">High confidence</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="permits" className="w-full">
          <TabsList>
            <TabsTrigger value="permits">Smart Permit Agent</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="permits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permit Requirements Analysis</CardTitle>
                <CardDescription>
                  AI-determined permit requirements and forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Homeowner</TableHead>
                      <TableHead>Municipality</TableHead>
                      <TableHead>Required Forms</TableHead>
                      <TableHead>Est. Fee</TableHead>
                      <TableHead>Processing Time</TableHead>
                      <TableHead>AI Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permitRequirements.map((permit) => (
                      <TableRow key={permit.id}>
                        <TableCell className="font-medium">{permit.project}</TableCell>
                        <TableCell>{permit.homeowner}</TableCell>
                        <TableCell className="text-sm">{permit.municipality}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap max-w-xs">
                            {permit.requiredForms.map((form, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {form}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>${permit.estimatedFee}</TableCell>
                        <TableCell className="text-sm">{permit.avgProcessingTime}</TableCell>
                        <TableCell>
                          <Badge variant={permit.aiConfidence > 90 ? "default" : "secondary"}>
                            {permit.aiConfidence}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permit.status === "submitted" ? "default" : "secondary"}>
                            {permit.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Compliance Checks</CardTitle>
                <CardDescription>
                  Automated compliance verification for permit applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Check Type</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Checked At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-medium">{check.project}</TableCell>
                        <TableCell>{check.checkType}</TableCell>
                        <TableCell>
                          <Badge variant={check.result === "Passed" ? "default" : "secondary"}>
                            {check.result === "Passed" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {check.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          {check.details}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {check.checkedAt}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Review</Button>
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

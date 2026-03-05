import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Sparkles, Search, Filter, Eye, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function ProjectAI() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const qaIssues = [
    {
      id: "1",
      estimate: "EST-2024-001",
      project: "Kitchen Remodel",
      homeowner: "John Smith",
      created: new Date("2024-11-15"),
      issues: [
        { type: "Missing scope", detail: "Electrical work not itemized" },
        { type: "Pricing irregularity", detail: "Cabinets 30% above market rate" }
      ],
      status: "pending",
      estimator: "Sarah Johnson",
      severity: "high",
    },
    {
      id: "2",
      estimate: "EST-2024-002",
      project: "Bathroom Renovation",
      homeowner: "Jane Doe",
      created: new Date("2024-11-16"),
      issues: [
        { type: "Missing disclaimer", detail: "Lead paint testing not mentioned" },
        { type: "Missing room", detail: "Powder room not included in scope" }
      ],
      status: "pending",
      estimator: "Mike Chen",
      severity: "medium",
    },
    {
      id: "3",
      estimate: "EST-2024-003",
      project: "Deck Addition",
      homeowner: "Bob Wilson",
      created: new Date("2024-11-17"),
      issues: [
        { type: "Incomplete materials", detail: "Fasteners and hardware not specified" }
      ],
      status: "reviewed",
      estimator: "Sarah Johnson",
      severity: "low",
    },
  ];

  const aiEstimates = [
    {
      id: "1",
      number: "EST-2024-003",
      project: "Deck Construction",
      homeowner: "Bob Wilson",
      aiSuggestions: 12,
      humanEdits: 3,
      totalValue: 15800,
      status: "draft",
      accuracy: 94.5,
      created: new Date("2024-11-17"),
    },
    {
      id: "2",
      number: "EST-2024-004",
      project: "Basement Finishing",
      homeowner: "Alice Brown",
      aiSuggestions: 18,
      humanEdits: 5,
      totalValue: 28500,
      status: "sent",
      accuracy: 91.2,
      created: new Date("2024-11-16"),
    },
  ];

  const filteredQAIssues = qaIssues.filter(issue => {
    if (filterStatus !== "all" && issue.status !== filterStatus) return false;
    if (searchQuery && !issue.project.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !issue.estimate.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            Project AI (QA & Estimates)
          </h1>
          <p className="text-muted-foreground mt-2">
            AI support for estimates, scopes, pricing, and project quality
          </p>
        </div>

        <Tabs defaultValue="qa" className="w-full">
          <TabsList>
            <TabsTrigger value="qa">Smart QA Agent</TabsTrigger>
            <TabsTrigger value="estimates">Smart Estimate Agent</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="qa" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quality Assurance Issues</CardTitle>
                    <CardDescription>
                      Estimates and bids flagged by AI for review
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{filteredQAIssues.length} issues</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by project or estimate..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Issues Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estimate</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Estimator</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQAIssues.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.estimate}</TableCell>
                        <TableCell>{item.project}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {item.issues.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            item.severity === "high" ? "destructive" :
                            item.severity === "medium" ? "default" : "secondary"
                          }>
                            {item.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.estimator}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(item.created, "MMM dd")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === "pending" ? "secondary" : "default"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                            <Button size="sm">Fix</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estimates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Assisted Estimates</CardTitle>
                <CardDescription>
                  Estimates drafted with AI help
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estimate #</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>AI Suggestions</TableHead>
                      <TableHead>Human Edits</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiEstimates.map((est) => (
                      <TableRow key={est.id}>
                        <TableCell className="font-medium">{est.number}</TableCell>
                        <TableCell>{est.project}</TableCell>
                        <TableCell>{est.aiSuggestions} items</TableCell>
                        <TableCell>{est.humanEdits} changes</TableCell>
                        <TableCell>
                          <Badge variant={est.accuracy > 90 ? "default" : "secondary"}>
                            {est.accuracy}%
                          </Badge>
                        </TableCell>
                        <TableCell>${est.totalValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={est.status === "draft" ? "secondary" : "default"}>
                            {est.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost"><FileText className="h-4 w-4" /></Button>
                            <Button size="sm">Review</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardDescription>Total AI Estimates</CardDescription>
                  <CardTitle className="text-3xl">24</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Avg Accuracy</CardDescription>
                  <CardTitle className="text-3xl">92.8%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Across all estimates</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Time Saved</CardDescription>
                  <CardTitle className="text-3xl">18hrs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Per estimator/month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

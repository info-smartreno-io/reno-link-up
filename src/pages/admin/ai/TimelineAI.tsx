import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, TrendingUp, CheckCircle, AlertCircle, Zap } from "lucide-react";

export default function TimelineAI() {
  const timelineDrafts = [
    {
      id: "1",
      project: "Kitchen Remodel - Johnson Residence",
      homeowner: "Sarah Johnson",
      phases: 6,
      duration: "8-10 weeks",
      startDate: "2024-02-01",
      estimatedEnd: "2024-04-15",
      confidence: 92,
      status: "pending_approval",
    },
    {
      id: "2",
      project: "Bathroom Renovation - Smith Home",
      homeowner: "Mike Smith",
      phases: 4,
      duration: "4-5 weeks",
      startDate: "2024-02-15",
      estimatedEnd: "2024-03-20",
      confidence: 88,
      status: "approved",
    },
  ];

  const messageDrafts = [
    {
      id: "1",
      type: "Homeowner Update",
      recipient: "Sarah Johnson",
      project: "Bathroom Renovation",
      subject: "Weekly Progress Update - Week 3",
      preview: "Good afternoon! We wanted to update you on the progress of your bathroom renovation...",
      sentiment: "positive",
      status: "draft",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      type: "Delay Notice",
      recipient: "Mike Smith",
      project: "Deck Construction",
      subject: "Project Timeline Update",
      preview: "We're writing to inform you of a brief delay in your project timeline due to...",
      sentiment: "neutral",
      status: "draft",
      createdAt: "2024-01-14",
    },
    {
      id: "3",
      type: "Completion Notice",
      recipient: "John Davis",
      project: "Kitchen Remodel",
      subject: "Project Completion & Final Walkthrough",
      preview: "Congratulations! We're excited to inform you that your kitchen remodel is complete...",
      sentiment: "positive",
      status: "sent",
      createdAt: "2024-01-13",
    },
  ];

  const metrics = {
    totalTimelines: 23,
    avgAccuracy: 89.5,
    timesSaved: "45 hours",
    messagesGenerated: 156,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Timeline & Communication AI
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-driven schedule and communication tools for PMs/admins
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Timelines Generated</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.totalTimelines}
                <Clock className="h-5 w-5 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Timeline Accuracy</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.avgAccuracy}%
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Based on actual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Time Saved</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.timesSaved}
                <Zap className="h-5 w-5 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Planning time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Messages Generated</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics.messagesGenerated}
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList>
            <TabsTrigger value="timeline">Smart Timeline Agent</TabsTrigger>
            <TabsTrigger value="communication">Smart Communication Agent</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Timelines</CardTitle>
                <CardDescription>
                  Auto-generated project timelines based on estimates and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Homeowner</TableHead>
                      <TableHead>Phases</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Est. End</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timelineDrafts.map((timeline) => (
                      <TableRow key={timeline.id}>
                        <TableCell className="font-medium">{timeline.project}</TableCell>
                        <TableCell>{timeline.homeowner}</TableCell>
                        <TableCell>{timeline.phases}</TableCell>
                        <TableCell>{timeline.duration}</TableCell>
                        <TableCell className="text-sm">{timeline.startDate}</TableCell>
                        <TableCell className="text-sm">{timeline.estimatedEnd}</TableCell>
                        <TableCell>
                          <Badge variant={timeline.confidence > 90 ? "default" : "secondary"}>
                            {timeline.confidence}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={timeline.status === "approved" ? "default" : "secondary"}>
                            {timeline.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {timeline.status === "pending_approval" && (
                              <Button variant="ghost" size="sm">Approve</Button>
                            )}
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

          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Draft Communications
                </CardTitle>
                <CardDescription>
                  AI-generated message drafts for homeowners and team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messageDrafts.map((msg) => (
                    <Card key={msg.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{msg.type}</CardTitle>
                            <CardDescription>{msg.project}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {msg.preview}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm">Edit & Send</Button>
                          <Button size="sm" variant="outline">Preview</Button>
                          <Button size="sm" variant="ghost">Discard</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

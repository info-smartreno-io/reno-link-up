import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";

export default function AIFeedback() {
  const feedbackStats = [
    { agent: "Smart Intake", positive: 45, negative: 3, accuracy: 93.8 },
    { agent: "Smart QA", positive: 38, negative: 7, accuracy: 84.4 },
    { agent: "Smart Estimate", positive: 52, negative: 8, accuracy: 86.7 },
    { agent: "Contractor Intake", positive: 29, negative: 2, accuracy: 93.5 },
    { agent: "Timeline Generator", positive: 33, negative: 5, accuracy: 86.8 },
    { agent: "Permit Assistant", positive: 18, negative: 1, accuracy: 94.7 },
    { agent: "Warranty Triage", positive: 41, negative: 4, accuracy: 91.1 },
  ];

  const recurringIssues = [
    { issue: "Missing electrical scope in kitchen remodels", count: 8, agent: "Smart QA" },
    { issue: "Incorrect permit forms for Bergen County", count: 5, agent: "Permit Assistant" },
    { issue: "Timeline buffer too short for custom cabinets", count: 4, agent: "Timeline Generator" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ThumbsUp className="h-8 w-8" />
            AI Feedback & Training
          </h1>
          <p className="text-muted-foreground mt-2">
            Track feedback on AI accuracy and continuously improve
          </p>
        </div>

        {/* Feedback Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>
              Feedback ratings from estimates, messages, and suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedbackStats.map((stat) => (
                <div key={stat.agent} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1">
                    <p className="font-medium">{stat.agent}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                        {stat.positive}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3 text-red-500" />
                        {stat.negative}
                      </span>
                    </div>
                  </div>
                  <Badge variant={stat.accuracy > 90 ? "default" : "secondary"}>
                    {stat.accuracy}% accuracy
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recurring Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Recurring Issues
            </CardTitle>
            <CardDescription>
              Common patterns identified from negative feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recurringIssues.map((issue, idx) => (
                <div key={idx} className="border-b pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{issue.issue}</p>
                    <Badge variant="outline">{issue.count} occurrences</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Agent: {issue.agent}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Controls</CardTitle>
            <CardDescription>
              Configure AI behavior and modes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="strict-mode">AI Strict Mode</Label>
              <Switch id="strict-mode" />
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, AI will only suggest high-confidence recommendations
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <Label htmlFor="suggestion-mode">AI Suggestion Mode</Label>
              <Switch id="suggestion-mode" defaultChecked />
            </div>
            <p className="text-sm text-muted-foreground">
              Allow AI to provide suggestions that require manual approval
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

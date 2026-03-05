import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Zap, Brain, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIHelperPanel } from "@/components/ai/AIHelperPanel";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";

export default function ContractorAIHub() {
  return (
    <ContractorLayout>
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">SmartReno AI Hub</h1>
          <p className="text-muted-foreground">Your AI-powered assistant across all operations</p>
        </div>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="global" className="gap-2">
            <Brain className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <LineChart className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="estimating" className="gap-2">
            <Zap className="h-4 w-4" />
            Estimating
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <AIHelperPanel context="global" />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  What Can AI Help With?
                </CardTitle>
                <CardDescription>
                  SmartReno AI understands your contractor business and can assist across all areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Ask About:</h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>• Project status and next steps</li>
                    <li>• Team scheduling and resource allocation</li>
                    <li>• Sales pipeline and conversion optimization</li>
                    <li>• Cost estimates and pricing strategies</li>
                    <li>• Document drafting and communications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <AIHelperPanel context="sales" />
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sales Coach AI</CardTitle>
                  <CardDescription>Get scripts, follow-up suggestions, and next best actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Draft follow-up email for lead
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Suggest closing strategies
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Analyze conversion funnel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="estimating" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <AIHelperPanel context="estimating" />
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estimator AI</CardTitle>
                  <CardDescription>Scope checks, risk flags, and upsell suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Review scope for gaps
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Identify risk factors
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Suggest upsell opportunities
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <AIHelperPanel context="operations" />
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Operations AI</CardTitle>
                  <CardDescription>SmartPlan generation and task prioritization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Generate today's SmartPlan
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Prioritize using Eisenhower matrix
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    Suggest workflow improvements
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </ContractorLayout>
  );
}

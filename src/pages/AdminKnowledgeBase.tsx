import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentEmbeddingManager } from "@/components/admin/DocumentEmbeddingManager";
import { RetrievalTestConsole } from "@/components/admin/RetrievalTestConsole";
import { Database, Search, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminKnowledgeBase() {
  return (
    <AdminLayout role="admin">
      <div className="space-y-6">
        <Breadcrumbs />

        <div>
          <h1 className="text-3xl font-bold mb-2">SmartReno Knowledge Base</h1>
          <p className="text-muted-foreground">
            Phase 11: Embedding engine, RAG training pipeline, and unified retrieval system
          </p>
        </div>

        <Tabs defaultValue="embed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="embed" className="gap-2">
              <Database className="h-4 w-4" />
              Embed Documents
            </TabsTrigger>
            <TabsTrigger value="retrieve" className="gap-2">
              <Search className="h-4 w-4" />
              Test Retrieval
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <Network className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="embed">
            <DocumentEmbeddingManager />
          </TabsContent>

          <TabsContent value="retrieve">
            <RetrievalTestConsole />
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Base Overview</CardTitle>
                  <CardDescription>
                    SmartReno's AI memory system status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Total Documents</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Embeddings</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Knowledge Graphs</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Supported Document Types</h3>
                    <ul className="grid grid-cols-2 gap-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        Estimates & Bids
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        Project Scopes
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                        Timelines
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                        Messages
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        SOPs & Workflows
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                        Homeowner FAQs
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                        Contractor Performance
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-lime-500"></span>
                        Knowledge Graphs
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

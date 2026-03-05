import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Database, CheckCircle2 } from "lucide-react";

export function DocumentEmbeddingManager() {
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState("estimate");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const embedDocument = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter content to embed",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-embedding-engine", {
        body: {
          documentId: crypto.randomUUID(),
          projectId: projectId || null,
          portal: "admin",
          documentType,
          content
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Document Embedded",
        description: `Successfully embedded ${data.token_count} tokens`
      });
    } catch (error) {
      console.error("Error embedding document:", error);
      toast({
        title: "Error",
        description: "Failed to embed document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const indexDocument = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter content to index",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-document-indexer", {
        body: {
          documentId: crypto.randomUUID(),
          projectId: projectId || null,
          content,
          documentType
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Document Indexed",
        description: `Created ${data.chunks_created} chunks`
      });
    } catch (error) {
      console.error("Error indexing document:", error);
      toast({
        title: "Error",
        description: "Failed to index document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Document Embedding Manager
        </CardTitle>
        <CardDescription>
          Embed documents into SmartReno's knowledge base
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Document Type</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estimate">Estimate</SelectItem>
                <SelectItem value="bid">Bid</SelectItem>
                <SelectItem value="scope">Scope</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="sop">SOP</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Project ID (Optional)</label>
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter project ID"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Paste document content here..."
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={embedDocument} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Embed Document
          </Button>
          <Button onClick={indexDocument} disabled={loading} variant="outline">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Index & Chunk
          </Button>
        </div>

        {result && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-semibold">Embedding Complete</span>
            </div>
            <pre className="text-sm text-muted-foreground overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

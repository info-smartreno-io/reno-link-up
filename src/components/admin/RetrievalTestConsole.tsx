import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

export function RetrievalTestConsole() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [contextType, setContextType] = useState("all");
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testRetrieval = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-retrieval-api", {
        body: {
          query,
          projectId: projectId || null,
          contextType
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Retrieval Complete",
        description: `Confidence: ${(data.confidence * 100).toFixed(0)}%`
      });
    } catch (error) {
      console.error("Error testing retrieval:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve answer",
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
          <Search className="h-5 w-5" />
          Retrieval Test Console
        </CardTitle>
        <CardDescription>
          Test SmartReno's unified retrieval API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Context Type</label>
            <Select value={contextType} onValueChange={setContextType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="estimate">Estimates</SelectItem>
                <SelectItem value="bid">Bids</SelectItem>
                <SelectItem value="timeline">Timelines</SelectItem>
                <SelectItem value="messages">Messages</SelectItem>
                <SelectItem value="SOP">SOPs</SelectItem>
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
          <label className="text-sm font-medium mb-2 block">Query</label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                testRetrieval();
              }
            }}
          />
        </div>

        <Button onClick={testRetrieval} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Search Knowledge Base
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Answer</h3>
              <p className="text-sm">{result.best_answer}</p>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Sources</h3>
                <ul className="text-sm space-y-1">
                  {result.sources.map((source: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">• {source}</li>
                  ))}
                </ul>
                <div className="mt-2 text-sm text-muted-foreground">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

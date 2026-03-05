import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Sparkles } from "lucide-react";

export function BlogGeneratorPanel() {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [projectType, setProjectType] = useState("");
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const { toast } = useToast();

  const generateBlog = async () => {
    if (!keywords) {
      toast({
        title: "Missing Keywords",
        description: "Please enter target keywords",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const keywordArray = keywords.split(",").map(k => k.trim());
      
      const { data, error } = await supabase.functions.invoke('ai-blog-generator', {
        body: {
          keywords: keywordArray,
          targetLocation,
          projectType
        }
      });

      if (error) throw error;

      setGeneratedPost(data);
      toast({
        title: "Blog Post Generated",
        description: "Draft saved successfully. Review before publishing.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          AI Blog Generator
        </CardTitle>
        <CardDescription>
          Generate SEO-optimized blog posts for SmartReno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Target Keywords (comma-separated)</Label>
          <Input
            placeholder="kitchen remodel NJ, Bergen County renovation"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Location (Optional)</Label>
            <Input
              placeholder="Bergen County"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Type (Optional)</Label>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="bathroom">Bathroom</SelectItem>
                <SelectItem value="basement">Basement</SelectItem>
                <SelectItem value="addition">Addition</SelectItem>
                <SelectItem value="siding">Siding</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={generateBlog} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>Generating...</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Blog Post
            </>
          )}
        </Button>

        {generatedPost && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label className="text-xs text-muted-foreground">Generated Title</Label>
              <p className="font-semibold">{generatedPost.title}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Meta Description</Label>
              <p className="text-sm text-muted-foreground">{generatedPost.meta_description}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">SEO Keywords</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {generatedPost.keywords?.map((kw: string, idx: number) => (
                  <Badge key={idx} variant="outline">{kw}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Content Preview</Label>
              <Textarea 
                value={generatedPost.content?.substring(0, 300) + "..."} 
                readOnly 
                rows={6}
                className="mt-1 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" variant="outline">
                Edit in Admin
              </Button>
              <Button className="flex-1">
                Review & Publish
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
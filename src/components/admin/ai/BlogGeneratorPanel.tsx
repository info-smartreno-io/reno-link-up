import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Eye, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';

export function BlogGeneratorPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [previewBlogId, setPreviewBlogId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch approved content ideas
  const { data: contentIdeas } = useQuery({
    queryKey: ['content-ideas-approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_content_ideas')
        .select('*')
        .eq('status', 'approved')
        .eq('content_type', 'blog_post')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch generated blog posts
  const { data: blogPosts } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch preview blog post
  const { data: previewBlog } = useQuery({
    queryKey: ['blog-post', previewBlogId],
    queryFn: async () => {
      if (!previewBlogId) return null;
      const { data, error } = await supabase
        .from('ai_blog_posts')
        .select('*')
        .eq('id', previewBlogId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!previewBlogId,
  });

  const generateBlog = useMutation({
    mutationFn: async (ideaId: string) => {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke('ai-blog-generator', {
        body: { contentIdeaId: ideaId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Blog post generated",
        description: "Your blog post has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['content-ideas-approved'] });
      setGenerating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
      setGenerating(false);
    },
  });

  const updateBlogStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'published') {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ai_blog_posts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Blog post status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'review': return 'default';
      case 'published': return 'default';
      case 'archived': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-3 w-3" />;
      case 'review': return <Eye className="h-3 w-3" />;
      case 'published': return <CheckCircle2 className="h-3 w-3" />;
      case 'archived': return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Blog Generator
          </CardTitle>
          <CardDescription>
            Generate full blog posts from approved content ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ideas">
            <TabsList>
              <TabsTrigger value="ideas">Content Ideas</TabsTrigger>
              <TabsTrigger value="posts">Generated Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="ideas" className="space-y-4">
              {!contentIdeas?.length ? (
                <p className="text-sm text-muted-foreground">
                  No approved content ideas available. Run the Content Pipeline first.
                </p>
              ) : (
                <div className="space-y-3">
                  {contentIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{idea.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {idea.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {idea.target_keywords?.slice(0, 3).map((keyword: string) => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => generateBlog.mutate(idea.id)}
                        disabled={generating}
                        size="sm"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {!blogPosts?.length ? (
                <p className="text-sm text-muted-foreground">
                  No blog posts generated yet
                </p>
              ) : (
                <div className="space-y-3">
                  {blogPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{post.title}</h4>
                          <Badge variant={getStatusColor(post.status)}>
                            {getStatusIcon(post.status)}
                            <span className="ml-1">{post.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {post.meta_description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewBlogId(post.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        {post.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => updateBlogStatus.mutate({ id: post.id, status: 'published' })}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!previewBlogId} onOpenChange={() => setPreviewBlogId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewBlog?.title}</DialogTitle>
          </DialogHeader>
          {previewBlog && (
            <div className="prose prose-sm max-w-none">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Meta Description:</p>
                <p className="text-sm text-muted-foreground">{previewBlog.meta_description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Slug: /{previewBlog.slug}
                </p>
              </div>
              <ReactMarkdown>{previewBlog.content}</ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

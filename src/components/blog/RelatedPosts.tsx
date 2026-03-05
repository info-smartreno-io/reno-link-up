import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
import { getAllPosts } from "@/data/blogLoader";
import type { Post } from "@/types/blog";

interface RelatedPostsProps {
  currentPost: Post;
  maxPosts?: number;
}

export default function RelatedPosts({ currentPost, maxPosts = 3 }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      const allPosts = await getAllPosts();
      
      // Filter out the current post
      const otherPosts = allPosts.filter(post => post.slug !== currentPost.slug);
      
      // Score each post based on similarity
      const scoredPosts = otherPosts.map(post => {
        let score = 0;
        
        // Same category = 10 points
        if (post.category === currentPost.category) {
          score += 10;
        }
        
        // Matching tags = 5 points per tag
        if (currentPost.tags && post.tags) {
          const matchingTags = post.tags.filter(tag => 
            currentPost.tags.includes(tag)
          );
          score += matchingTags.length * 5;
        }
        
        // More recent posts get slight boost
        const daysDiff = Math.abs(
          new Date(post.date).getTime() - new Date(currentPost.date).getTime()
        ) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 30) score += 2;
        else if (daysDiff < 90) score += 1;
        
        return { post, score };
      });
      
      // Sort by score (highest first) and take top N
      const topRelated = scoredPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPosts)
        .map(item => item.post);
      
      setRelatedPosts(topRelated);
    };
    
    fetchRelatedPosts();
  }, [currentPost, maxPosts]);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Related Articles</h2>
        <p className="text-muted-foreground">
          Continue reading about {currentPost.category.toLowerCase()} and renovation tips
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <Link 
            key={post.slug} 
            to={`/blog/${post.slug}`}
            className="group"
          >
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              {/* Hero Image */}
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
                <img
                  src={post.hero}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=450&fit=crop";
                  }}
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                    {post.category}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="line-clamp-3 mb-3">
                  {post.description}
                </CardDescription>
                
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  Read more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

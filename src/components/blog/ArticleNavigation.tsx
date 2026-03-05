import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Post } from "@/types/blog";

interface ArticleNavigationProps {
  prevPost?: Post;
  nextPost?: Post;
}

export function ArticleNavigation({ prevPost, nextPost }: ArticleNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-12">
      {prevPost ? (
        <Link to={prevPost.url} className="group">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ArrowLeft className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Previous Article</p>
                  <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {prevPost.title}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <div />
      )}

      {nextPost && (
        <Link to={nextPost.url} className="group">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-r-4 border-r-primary">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 justify-end text-right">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next Article</p>
                  <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {nextPost.title}
                  </h3>
                </div>
                <ArrowRight className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}

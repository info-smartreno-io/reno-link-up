import { Card, CardContent } from "@/components/ui/card";
import { Eye, Clock, Calendar, TrendingUp } from "lucide-react";
import { formatReadingTime } from "@/lib/readingTime";

interface ArticleStatsProps {
  date: string;
  readingTime?: number;
  category: string;
}

export function ArticleStats({ date, readingTime, category }: ArticleStatsProps) {
  const publishDate = new Date(date);
  const daysAgo = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Article Info
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Published</p>
              <p className="font-medium">{daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}</p>
            </div>
          </div>
          {readingTime && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Reading Time</p>
                <p className="font-medium">{formatReadingTime(readingTime)}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Category</p>
              <p className="font-medium">{category}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Popularity</p>
              <p className="font-medium">Trending</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

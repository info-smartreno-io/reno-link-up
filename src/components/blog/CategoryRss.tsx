import { Rss } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryRssProps {
  category: string;
  categorySlug: string;
}

export default function CategoryRss({ category, categorySlug }: CategoryRssProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border bg-muted/30">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Rss className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1">Subscribe to {category}</h4>
        <p className="text-xs text-muted-foreground">
          Get updates for {category.toLowerCase()} articles only
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a 
            href={`/rss/${categorySlug}.xml`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="gap-1.5 text-xs"
          >
            <Rss className="h-3.5 w-3.5" />
            RSS
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a 
            href={`/rss/${categorySlug}-atom.xml`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="gap-1.5 text-xs"
          >
            <Rss className="h-3.5 w-3.5" />
            Atom
          </a>
        </Button>
      </div>
    </div>
  );
}

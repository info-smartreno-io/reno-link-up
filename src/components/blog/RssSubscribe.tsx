import { Rss } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RssSubscribe() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 rounded-2xl border bg-card">
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Rss className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1">Subscribe to Updates</h3>
        <p className="text-sm text-muted-foreground">
          Get the latest renovation guides and tips delivered to your RSS reader
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="gap-2">
            <Rss className="h-4 w-4" />
            RSS Feed
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href="/atom.xml" target="_blank" rel="noopener noreferrer" className="gap-2">
            <Rss className="h-4 w-4" />
            Atom Feed
          </a>
        </Button>
      </div>
    </div>
  );
}

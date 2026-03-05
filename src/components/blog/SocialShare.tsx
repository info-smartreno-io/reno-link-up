import { Facebook, Twitter, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SocialShareProps {
  title: string;
  description: string;
  url: string;
}

export default function SocialShare({ title, description, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `https://smartreno.io${url}`;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card">
      <div>
        <h3 className="text-lg font-semibold mb-1">Share this article</h3>
        <p className="text-sm text-muted-foreground">
          Help others find this renovation guide
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-colors"
          onClick={() => window.open(shareLinks.facebook, "_blank", "width=600,height=400")}
        >
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-colors"
          onClick={() => window.open(shareLinks.twitter, "_blank", "width=600,height=400")}
        >
          <Twitter className="h-4 w-4" />
          <span>Twitter</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-colors"
          onClick={() => window.open(shareLinks.linkedin, "_blank", "width=600,height=400")}
        >
          <Linkedin className="h-4 w-4" />
          <span>LinkedIn</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              <span>Copy Link</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

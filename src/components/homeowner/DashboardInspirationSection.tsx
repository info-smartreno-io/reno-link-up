import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, ShoppingBag, Palette, BookOpen, ArrowRight, Pin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VENDOR_LINKS = [
  { name: "Floor & Decor", url: "https://www.flooranddecor.com", category: "Flooring & Tile" },
  { name: "Build.com", url: "https://www.build.com", category: "Fixtures & Hardware" },
  { name: "Wayfair", url: "https://www.wayfair.com", category: "Furniture & Décor" },
  { name: "The Tile Shop", url: "https://www.tileshop.com", category: "Tile & Stone" },
  { name: "Ferguson", url: "https://www.ferguson.com", category: "Plumbing & Lighting" },
  { name: "Cabinets To Go", url: "https://www.cabinetstogo.com", category: "Cabinetry" },
];

export function DashboardInspirationSection() {
  const navigate = useNavigate();
  const [pinterestUrl, setPinterestUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSavePinterest = async () => {
    if (!pinterestUrl.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first");
        return;
      }
      await supabase.from("profiles").update({
        pinterest_board_url: pinterestUrl.trim(),
      } as any).eq("id", user.id);
      toast.success("Pinterest board saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Inspiration & Materials</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Browse materials, save your inspiration, and read expert advice.</p>
      </div>

      {/* Vendor Browsing */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Browse Materials & Vendors</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {VENDOR_LINKS.map((vendor) => (
              <a
                key={vendor.name}
                href={vendor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{vendor.name}</p>
                  <p className="text-[11px] text-muted-foreground">{vendor.category}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pinterest Board */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Your Pinterest Board</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Share your Pinterest board so our design team and contractors can see your style preferences.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://pinterest.com/yourboard"
              value={pinterestUrl}
              onChange={(e) => setPinterestUrl(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleSavePinterest} disabled={saving || !pinterestUrl.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Industry Blogs & Resources */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Industry Trends & Resources</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { name: "Architectural Digest", url: "https://www.architecturaldigest.com", desc: "Design trends & architecture" },
              { name: "Houzz", url: "https://www.houzz.com/magazine", desc: "Home renovation ideas & costs" },
              { name: "Dwell", url: "https://www.dwell.com", desc: "Modern architecture & design" },
              { name: "Remodeling Magazine", url: "https://www.remodeling.hw.net", desc: "Cost vs. value & industry data" },
              { name: "This Old House", url: "https://www.thisoldhouse.com", desc: "How-to guides & project planning" },
              { name: "The Spruce", url: "https://www.thespruce.com/home-renovation-4127611", desc: "Budgeting & renovation tips" },
            ].map((blog) => (
              <a
                key={blog.name}
                href={blog.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{blog.name}</p>
                  <p className="text-[11px] text-muted-foreground">{blog.desc}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
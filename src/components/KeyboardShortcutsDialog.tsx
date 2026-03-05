import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard, ArrowLeft, Home, Search, Plus, Slash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Shortcut {
  key: string;
  description: string;
  icon?: React.ReactNode;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    key: "?",
    description: "Show keyboard shortcuts",
    icon: <Keyboard className="w-4 h-4" />,
    category: "General",
  },
  {
    key: "Ctrl+K",
    description: "Open command palette",
    icon: <Search className="w-4 h-4" />,
    category: "General",
  },
  {
    key: "Esc",
    description: "Close dialogs and modals",
    category: "General",
  },
  {
    key: "B",
    description: "Go back / Navigate to previous page",
    icon: <ArrowLeft className="w-4 h-4" />,
    category: "Navigation",
  },
  {
    key: "D",
    description: "Go to Dashboard",
    icon: <Home className="w-4 h-4" />,
    category: "Navigation",
  },
  {
    key: "N",
    description: "New/Create (context-sensitive)",
    icon: <Plus className="w-4 h-4" />,
    category: "Actions",
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Open dialog when '?' is pressed (Shift + /)
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen(true);
      }
      // Close dialog when Escape is pressed
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [open]);

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon && (
                          <div className="text-muted-foreground">
                            {shortcut.icon}
                          </div>
                        )}
                        <span className="text-sm">{shortcut.description}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs px-2 py-1"
                      >
                        {shortcut.key}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press{" "}
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
              ?
            </kbd>{" "}
            anytime to view this help dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

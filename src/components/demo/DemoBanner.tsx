import { useNavigate } from "react-router-dom";
import { useDemoMode } from "@/context/DemoModeContext";
import { Button } from "@/components/ui/button";
import { X, Sparkles, UserPlus } from "lucide-react";

export function DemoBanner() {
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const handleExit = () => {
    exitDemoMode();
    navigate("/contractor/auth");
  };

  const handleCreateAccount = () => {
    exitDemoMode();
    navigate("/contractor/auth");
  };

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">
          Demo Mode — Explore the contractor portal with sample data
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 bg-white/90 border-white/50 text-primary hover:bg-white"
          onClick={handleCreateAccount}
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Create Account
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-primary-foreground hover:bg-white/20"
          onClick={handleExit}
        >
          <X className="h-4 w-4 mr-1" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
}

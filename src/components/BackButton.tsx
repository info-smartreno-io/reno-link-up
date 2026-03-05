import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
}

export function BackButton({ className, variant = "ghost" }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on these pages
  const noBackButtonPages = [
    "/",
    "/login",
    "/auth",
    "/admin/auth",
    "/contractor/auth",
    "/architect/auth",
    "/estimator/auth",
    "/interiordesigner/auth",
    "/professional/auth",
  ];

  if (noBackButtonPages.includes(location.pathname)) {
    return null;
  }

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // If no history, navigate to appropriate dashboard based on current path
      if (location.pathname.startsWith("/admin")) {
        navigate("/admin/dashboard");
      } else if (location.pathname.startsWith("/contractor")) {
        navigate("/contractor/dashboard");
      } else if (location.pathname.startsWith("/architect")) {
        navigate("/architect/dashboard");
      } else if (location.pathname.startsWith("/estimator")) {
        navigate("/estimator-dashboard");
      } else if (location.pathname.startsWith("/interiordesigner")) {
        navigate("/interiordesigner/dashboard");
      } else {
        navigate("/");
      }
    }
  };

  // Add keyboard shortcut (B key) for back navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if 'B' is pressed and not in an input/textarea
      if (
        e.key.toLowerCase() === 'b' && 
        !noBackButtonPages.includes(location.pathname) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [location.pathname]);

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </Button>
  );
}

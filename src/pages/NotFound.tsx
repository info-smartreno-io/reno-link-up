import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Shield, Hammer } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-lg px-4">
        {/* Brand Mark */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-3">
          <h1 className="text-7xl font-extrabold text-foreground tracking-tight">404</h1>
          <p className="text-xl font-semibold text-foreground">Page not found</p>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Brand Taglines */}
        <div className="space-y-2 py-4 border-y border-border">
          <p className="text-lg font-bold text-primary">
            SmartReno protects your time, money and home.
          </p>
          <p className="text-sm text-muted-foreground italic">
            The first step before you renovate.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleGoBack} variant="default" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button onClick={() => navigate("/start-your-renovation")} variant="secondary" size="lg">
            <Hammer className="mr-2 h-4 w-4" />
            Start Your Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

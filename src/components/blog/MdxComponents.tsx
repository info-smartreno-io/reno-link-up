import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface CalloutProps {
  title?: string;
  type?: "info" | "warning" | "success" | "error";
  children: React.ReactNode;
}

export function Callout({ title, type = "info", children }: CalloutProps) {
  const icons = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
  };

  const variants = {
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
    warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
    success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
    error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  };

  return (
    <Alert className={`my-6 ${variants[type]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          {title && <AlertTitle className="mb-2 font-semibold">{title}</AlertTitle>}
          <AlertDescription className="text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
            {children}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

interface CTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

export function CTA({
  title = "Ready to start your renovation?",
  description = "Get a free estimate from vetted contractors in Bergen, Passaic, Morris, Essex, and Hudson County.",
  buttonText = "Get Free Estimate",
  buttonLink = "/#get-started",
}: CTAProps) {
  return (
    <div className="my-10 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center shadow-sm">
      <h3 className="text-2xl font-bold tracking-tight mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
      <Button size="lg" asChild className="shadow-md">
        <Link to={buttonLink}>{buttonText}</Link>
      </Button>
    </div>
  );
}

// Export all components that can be used in MDX
export const mdxComponents = {
  Callout,
  CTA,
};

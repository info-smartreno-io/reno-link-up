import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTABlock() {
  return (
    <div className="my-12 flex flex-col items-center gap-4 rounded-2xl border bg-muted/30 p-8 text-center">
      <h4 className="text-2xl font-bold">Ready to start your renovation?</h4>
      <p className="text-muted-foreground max-w-md">
        Get a detailed estimate from a SmartReno estimator and connect with vetted contractors.
      </p>
      <Button asChild size="lg" className="gap-2">
        <Link to="/homeowners#estimate">
          Get Estimate <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

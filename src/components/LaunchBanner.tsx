import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LaunchBanner() {
  return (
    <div className="bg-primary text-primary-foreground py-10 px-4">
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl leading-tight">
          Launching in Northern New Jersey
        </h2>
        <p className="text-primary-foreground/80 text-lg max-w-xl">
          Join the first homeowners and contractors using SmartReno.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-lg font-semibold rounded-xl bg-background text-foreground hover:bg-background/90 transition-colors"
          >
            <Link to="/start-your-renovation">Start Your Project</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg font-semibold rounded-xl border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <Link to="/contractors/join">Join Contractor Network</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

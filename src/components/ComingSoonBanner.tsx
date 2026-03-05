import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ComingSoonBanner() {
  return (
    <div className="bg-[#1E40AF] text-white py-6 px-4">
      <div className="container mx-auto flex flex-col items-center justify-center gap-3 text-center">
        <Clock className="h-10 w-10 flex-shrink-0" />
        <span className="font-bold text-[48px] leading-tight">
          COMING SOON TO A CITY NEAR YOU!
        </span>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-lg font-semibold rounded-xl bg-white text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white border-2 border-white transition-colors"
          >
            <Link to="/homeowners">I'm a Homeowner</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-lg font-semibold rounded-xl bg-white text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white border-2 border-white transition-colors"
          >
            <Link to="/contractors">I'm a Contractor</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

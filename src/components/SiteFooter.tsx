import { Link } from "react-router-dom";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";

const brand = {
  name: "SmartReno",
};

export function SiteFooter() {
  return (
    <>
      {/* Footer with Service Areas */}
      <footer className="py-10 pt-20 border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Footer Links */}
          <div className="grid gap-8 md:grid-cols-4 text-sm mb-12">
            <div>
              <div className="font-semibold">{brand.name}</div>
              <p className="mt-2 text-muted-foreground mb-3">Local first in Northern NJ.</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/locations/bergen-county" className="hover:underline">Bergen County</Link></li>
                <li><Link to="/locations/passaic-county" className="hover:underline">Passaic County</Link></li>
                <li><Link to="/locations/morris-county" className="hover:underline">Morris County</Link></li>
                <li><Link to="/locations/essex-county" className="hover:underline">Essex County</Link></li>
                <li><Link to="/locations/hudson-county" className="hover:underline">Hudson County</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Explore</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="hover:underline" href="/#how">How it works</a></li>
                <li><a className="hover:underline" href="/#audiences">Homeowners & Contractors</a></li>
                <li><a className="hover:underline" href="/#faq">FAQ</a></li>
                <li><Link to="/locations" className="hover:underline">Service Locations</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Company</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:underline">About</Link></li>
                <li><Link to="/careers" className="hover:underline">Careers</Link></li>
                <li><Link to="/blog" className="hover:underline">Blog</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold">Contact</div>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li><a className="underline" href="mailto:info@smartreno.io">info@smartreno.io</a></li>
                <li>(201) 788-9502</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground border-t pt-6">
          © {new Date().getFullYear()} SmartReno. All rights reserved.
        </div>
      </footer>

      <FooterAdminLogin />
    </>
  );
}

import { Link } from "react-router-dom";
import smartrenoLogo from "@/assets/smartreno-logo-main.png";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";

export function MarketingFooter() {
  return (
    <>
      <footer className="border-t border-border/50 bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <img src={smartrenoLogo} alt="SmartReno" className="h-8 brightness-0 invert mb-4" />
              <p className="text-sm text-background/60 max-w-xs leading-relaxed">
                SmartReno structures residential renovations before construction begins. Serving Northern New Jersey.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-background/40 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-background/60">
                <li><Link to="/how-it-works" className="hover:text-background transition-colors">How It Works</Link></li>
                <li><Link to="/renovation-costs" className="hover:text-background transition-colors">Renovation Costs</Link></li>
                <li><Link to="/smartreno-process" className="hover:text-background transition-colors">The Process</Link></li>
                <li><Link to="/property-renovation-report" className="hover:text-background transition-colors">Property Analysis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-background/40 mb-4">Network</h4>
              <ul className="space-y-2.5 text-sm text-background/60">
                <li><Link to="/contractors" className="hover:text-background transition-colors">Contractors</Link></li>
                <li><Link to="/for-contractors" className="hover:text-background transition-colors">For Contractors</Link></li>
                <li><Link to="/contractors/join" className="hover:text-background transition-colors">Join Network</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-background/40 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-background/60">
                <li><Link to="/about" className="hover:text-background transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-background transition-colors">Blog</Link></li>
                <li><a href="mailto:info@smartreno.io" className="hover:text-background transition-colors">Contact</a></li>
                <li><Link to="/login" className="hover:text-background transition-colors">Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-background/40">
              © {new Date().getFullYear()} SmartReno. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-background/40">
              <Link to="/locations" className="hover:text-background/60 transition-colors">Service Areas</Link>
              <span>Bergen • Passaic • Morris • Essex • Hudson</span>
            </div>
          </div>
        </div>
      </footer>
      <FooterAdminLogin />
    </>
  );
}

import { Link } from "react-router-dom";
import smartrenoLogo from "@/assets/smartreno-logo-main.png";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/50 bg-foreground text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <img src={smartrenoLogo} alt="SmartReno" className="h-10 brightness-0 invert mb-5" />
            <p className="text-sm font-semibold text-primary-foreground/80 mb-1">
              SmartReno protects your time, money and home.
            </p>
            <p className="text-xs text-primary-foreground/50 italic mb-4">
              The first step before you renovate.
            </p>
            <p className="text-sm text-primary-foreground/60 max-w-xs leading-relaxed">
              SmartReno structures residential renovations before construction begins. Serving Northern New Jersey.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40 mb-5">Platform</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li><Link to="/how-it-works" className="hover:text-primary-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/renovation-costs" className="hover:text-primary-foreground transition-colors">Renovation Costs</Link></li>
              <li><Link to="/property-renovation-report" className="hover:text-primary-foreground transition-colors">Property Analysis</Link></li>
              <li><Link to="/smartreno-process" className="hover:text-primary-foreground transition-colors">The Process</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40 mb-5">Network</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li><Link to="/contractors" className="hover:text-primary-foreground transition-colors">Contractors</Link></li>
              <li><Link to="/designers" className="hover:text-primary-foreground transition-colors">Designers</Link></li>
              <li><Link to="/for-contractors" className="hover:text-primary-foreground transition-colors">For Contractors</Link></li>
              <li><Link to="/contractors/join" className="hover:text-primary-foreground transition-colors">Join Network</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/40 mb-5">Company</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              <li><Link to="/about" className="hover:text-primary-foreground transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-primary-foreground transition-colors">Blog</Link></li>
              <li><a href="mailto:info@smartreno.io" className="hover:text-primary-foreground transition-colors">Contact</a></li>
              <li><Link to="/login" className="hover:text-primary-foreground transition-colors">Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} SmartReno. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-primary-foreground/40">
            <Link to="/locations" className="hover:text-primary-foreground/60 transition-colors">Service Areas</Link>
            <span>Bergen • Passaic • Morris • Essex • Hudson</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

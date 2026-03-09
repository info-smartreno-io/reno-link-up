import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, ArrowLeft } from "lucide-react";
import smartrenoLogo from "@/assets/smartreno-logo-main.png";

const NAV_LINKS = [
  { label: "Platform", to: "/how-it-works" },
  { label: "Software", to: "/smartreno-process" },
  { label: "Homeowners", to: "/start-your-renovation" },
  { label: "Contractors", to: "/contractors" },
  { label: "Projects", to: "/renovation-costs" },
  { label: "Resources", to: "/blog" },
];

export function MarketingNavbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-background"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={smartrenoLogo} alt="SmartReno" className="h-9" />
        </Link>

        {/* Desktop Links */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <Link
            to="/login"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {isLoggedIn ? "Dashboard" : "Login"}
          </Link>
          <Link
            to="/contractors/join"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Join Network
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background pb-6 px-6 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="block py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-2">
            <Link
              to="/contractors/join"
              className="rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Join Network
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {isLoggedIn ? "Dashboard" : "Login"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

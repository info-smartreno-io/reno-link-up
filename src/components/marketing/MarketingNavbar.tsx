import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X } from "lucide-react";
import smartrenoLogo from "@/assets/smartreno-logo-main.png";

const NAV_LINKS = [
  { label: "How It Works", to: "/how-it-works" },
  { label: "Renovation Costs", to: "/renovation-costs" },
  { label: "Contractors", to: "/contractors" },
  { label: "For Contractors", to: "/for-contractors" },
];

export function MarketingNavbar() {
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
    <>
      {/* Trust Bar */}
      <div className="bg-foreground text-background text-center text-xs sm:text-sm py-2 px-4 font-medium tracking-wide">
        Serving Northern New Jersey — Structured renovation planning before construction begins
      </div>

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
            : "bg-background/80 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={smartrenoLogo} alt="SmartReno" className="h-9" />
          </Link>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/start-your-renovation"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
            >
              Start Project
            </Link>
            {isLoggedIn ? (
              <Link
                to="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-background pb-6 px-6 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="block py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <Link
                to="/start-your-renovation"
                className="rounded-lg bg-foreground px-4 py-2.5 text-center text-sm font-semibold text-background"
                onClick={() => setMobileOpen(false)}
              >
                Start Project
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

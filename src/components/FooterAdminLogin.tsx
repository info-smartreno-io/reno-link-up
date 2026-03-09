import smartrenoLogo from "@/assets/smartreno-logo-main.png";

/**
 * SiteFooterBranded - Branded footer with SmartReno logo and taglines.
 * Replaces the old FooterAdminLogin. No admin login — team uses admin.smartreno.io
 */
export function FooterAdminLogin() {
  return (
    <footer className="w-full border-t bg-muted/30 py-10">
      <div className="container mx-auto flex flex-col items-center justify-center space-y-4 px-4">
        <img src={smartrenoLogo} alt="SmartReno" className="h-12" />
        <p className="text-sm font-semibold text-foreground">
          SmartReno protects your time, money and home.
        </p>
        <p className="text-xs text-muted-foreground italic">
          The first step before you renovate.
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SmartReno. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

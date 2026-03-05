import { Helmet } from "react-helmet-async";
import { SiteNavbar } from "@/components/SiteNavbar";
import { FooterAdminLogin } from "@/components/FooterAdminLogin";

export default function Partner() {
  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Partner with SmartReno | Northern NJ</title>
        <meta name="description" content="Partner with SmartReno to grow your renovation business in Northern New Jersey." />
      </Helmet>
      
      <SiteNavbar />
      
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">Partner with SmartReno</h1>
        <p className="text-center text-muted-foreground">Coming soon...</p>
      </div>

      <FooterAdminLogin />
    </main>
  );
}

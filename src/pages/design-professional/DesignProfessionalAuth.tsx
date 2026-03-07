import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";

export default function DesignProfessionalAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/design-professional/dashboard", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={smartRenoLogo} alt="SmartReno" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Design Professional Portal</h1>
          <p className="text-muted-foreground mt-2">
            For architects, interior designers, kitchen &amp; bath designers, and visualization professionals
          </p>
        </div>
        <div className="bg-card p-8 rounded-lg shadow-sm border">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(var(--primary))",
                    brandAccent: "hsl(var(--primary))",
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin + "/design-professional/dashboard"}
          />
        </div>
      </div>
    </div>
  );
}

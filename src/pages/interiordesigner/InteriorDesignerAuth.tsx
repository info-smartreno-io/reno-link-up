import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function InteriorDesignerAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/interiordesigner/dashboard", { replace: true });
      }
    });
  }, [navigate]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={smartRenoLogo} alt="SmartReno" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Interior Designer Portal</h1>
          <p className="text-muted-foreground mt-2">Sign in to access bid opportunities</p>
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
            redirectTo={window.location.origin + "/interiordesigner/dashboard"}
          />
          
        </div>
      </div>
    </div>
  );
}

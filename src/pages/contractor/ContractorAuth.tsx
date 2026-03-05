import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";


export default function ContractorAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has contractor role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "contractor")
        .single();

      if (!roleData) {
        // Check if they have a pending application
        const { data: appData } = await supabase
          .from("contractor_applications")
          .select("status")
          .eq("user_id", data.user.id)
          .single();

        const { error: signOutError } = await supabase.auth.signOut();
        
        if (signOutError) {
          console.log("ContractorAuth sign out:", signOutError.message || signOutError);
        }

        try {
          localStorage.removeItem("sb-pscsnsgvfjcbldomnstb-auth-token");
        } catch (storageError) {
          console.log("ContractorAuth storage cleanup:", storageError);
        }
        
        if (appData?.status === 'pending') {
          throw new Error("Your application is under review. You'll be notified when approved.");
        } else if (appData?.status === 'rejected') {
          throw new Error("Your application was not approved. Please contact support.");
        } else {
          throw new Error("Access denied. Please submit a contractor application first.");
        }
      }

      navigate("/contractor/dashboard", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={smartRenoLogo} alt="SmartReno" className="h-12" />
          </div>
          <div>
            <CardTitle className="text-2xl text-center">
              Contractor Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to access your contractor dashboard
              <br />
              <span className="text-sm text-muted-foreground">
                New contractor registration is currently closed.
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
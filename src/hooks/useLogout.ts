import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLogout(redirectPath: string = "/") {
  const { toast } = useToast();

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Ignore errors - session may already be invalid (e.g., session_not_found)
      console.log("Logout cleanup:", error.message || error);
    }

    // Ensure local auth token is cleared even if signOut errored
    try {
      localStorage.removeItem("sb-pscsnsgvfjcbldomnstb-auth-token");
    } catch (storageError) {
      console.log("Logout storage cleanup:", storageError);
    }
    
    toast({
      title: "Signed out",
      description: "You've been signed out of your account.",
    });
    
    // Use window.location for a full page reload to clear all state
    window.location.href = redirectPath;
  };

  return { logout };
}

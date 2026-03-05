import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

interface CreateAccountPromptProps {
  email: string;
  name: string;
  estimateRequestId?: string;
}

export function CreateAccountPrompt({ email, name, estimateRequestId }: CreateAccountPromptProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (pwd: string) => {
    try {
      passwordSchema.parse(pwd);
      setErrors(prev => ({ ...prev, password: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, password: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleCreateAccount = async () => {
    setErrors({});

    // Validate password
    if (!validatePassword(password)) {
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }

    setIsCreating(true);

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/homeowner/portal`
        }
      });

      if (signUpError) {
        // If user already exists, try signing in
        if (signUpError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

          if (signInError) {
            throw new Error("Account already exists. Please use a different password or login with your existing password.");
          }
        } else {
          throw signUpError;
        }
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user && estimateRequestId) {
        // Link the estimate request to the user
        const { error: updateError } = await supabase
          .from('estimate_requests')
          .update({ user_id: user.id })
          .eq('id', estimateRequestId);

        if (updateError) {
          console.error('Failed to link estimate to user:', updateError);
        }
      }

      toast({
        title: "Account Created! 🎉",
        description: "Redirecting to your homeowner portal...",
      });

      // Small delay before redirect for toast to show
      setTimeout(() => {
        navigate('/homeowner/portal');
      }, 1500);

    } catch (error: any) {
      console.error('Account creation error:', error);
      toast({
        variant: "destructive",
        title: "Account Creation Failed",
        description: error.message || "Please try again or contact support.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Inquiry Received</CardTitle>
        <CardDescription>
          Login into your homeowner portal to set a time for an estimator to come out! Create your portal account below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-primary/5 border-primary/20">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Your account email: <strong>{email}</strong>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="password">Create Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (e.target.value) validatePassword(e.target.value);
              }}
              placeholder="Enter a secure password"
              className={errors.password ? "border-destructive" : ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              placeholder="Re-enter your password"
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Button
            onClick={handleCreateAccount}
            disabled={isCreating || !password || !confirmPassword}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account & Access Portal"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => navigate('/login', { state: { email } })}
            >
              Sign in instead
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

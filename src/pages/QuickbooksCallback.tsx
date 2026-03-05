import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function QuickbooksCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error parameter from QuickBooks
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || 'Failed to connect to QuickBooks');
        
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: errorDescription || "Failed to connect to QuickBooks. Please try again.",
        });

        // Redirect after showing error
        setTimeout(() => {
          redirectToQuickBooks();
        }, 3000);
        return;
      }

      // Check for success parameter
      const connected = searchParams.get('connected');
      
      if (connected === 'true') {
        setStatus('success');
        
        toast({
          title: "Connected successfully",
          description: "Your QuickBooks account has been connected.",
        });

        // Redirect after showing success
        setTimeout(() => {
          redirectToQuickBooks();
        }, 2000);
        return;
      }

      // If we have code and realmId, the edge function will handle it
      const code = searchParams.get('code');
      const realmId = searchParams.get('realmId');

      if (code && realmId) {
        setStatus('loading');
        // The edge function should have already processed this
        // Just wait a bit and redirect
        setTimeout(() => {
          redirectToQuickBooks();
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage('Invalid callback parameters');
        setTimeout(() => {
          redirectToQuickBooks();
        }, 3000);
      }
    };

    const redirectToQuickBooks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }

        // Get user role to redirect to appropriate page
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const role = userRoles?.role;

        // Redirect based on role
        if (role === 'admin') {
          navigate('/admin/quickbooks');
        } else {
          navigate('/quickbooks');
        }
      } catch (error) {
        console.error('Error redirecting:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Connecting to QuickBooks
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Connection Successful
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Connection Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we connect your QuickBooks account...'}
            {status === 'success' && 'Your QuickBooks account has been successfully connected.'}
            {status === 'error' && 'There was a problem connecting your QuickBooks account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <Alert>
              <AlertDescription>
                This should only take a moment. You will be redirected automatically.
              </AlertDescription>
            </Alert>
          )}
          {status === 'success' && (
            <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
              <AlertDescription>
                Redirecting you to the QuickBooks settings page...
              </AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>
                {errorMessage || 'An unexpected error occurred. Please try connecting again.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

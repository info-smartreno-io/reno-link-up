import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractorLayout } from "@/components/contractor/ContractorLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, FileText, Calendar, DollarSign } from "lucide-react";
import smartRenoLogo from "@/assets/smartreno-logo-blue.png";
import { useDemoMode } from "@/context/DemoModeContext";
import { getDemoEstimates } from "@/utils/demoContractorData";

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  project_name: string;
  amount: number;
  status: string;
  created_at: string;
  valid_until: string | null;
}

export default function ContractorEstimates() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      setEstimates(getDemoEstimates());
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/contractor/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isDemoMode]);

  useEffect(() => {
    const fetchEstimates = async () => {
      if (!user || isDemoMode) return;

      try {
        const { data, error } = await supabase
          .from('estimates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setEstimates(data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching estimates:", error);
        toast({
          title: "Error",
          description: "Failed to load estimates.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchEstimates();
  }, [user, toast, isDemoMode]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      sent: "bg-blue-100 text-blue-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return variants[status] || variants.draft;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ContractorLayout>
      <div className="min-h-screen bg-background -m-6">
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractor/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Estimates</h1>
          <Button onClick={() => navigate('/estimator/prepare-estimate')}>
            <FileText className="h-4 w-4 mr-2" />
            Create Estimate
          </Button>
        </div>

        {estimates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No estimates created yet</p>
              <Button onClick={() => navigate('/estimator/prepare-estimate')}>
                Create Your First Estimate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estimates.map((estimate) => (
              <Card key={estimate.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{estimate.client_name}</CardTitle>
                    <Badge className={getStatusBadge(estimate.status)}>
                      {estimate.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{estimate.project_name}</p>
                  <p className="text-xs text-muted-foreground">#{estimate.estimate_number}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xl font-bold">${estimate.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {new Date(estimate.created_at).toLocaleDateString()}</span>
                  </div>
                  {estimate.valid_until && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Valid until: {new Date(estimate.valid_until).toLocaleDateString()}</span>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate(`/estimator/prepare-estimate/${estimate.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </ContractorLayout>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { EstimateBuilder } from "@/components/estimates/EstimateBuilder";

export default function PrepareEstimate() {
  const { id } = useParams();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setLead(data);
      } else {
        toast({
          title: "Lead Not Found",
          description: "The lead doesn't exist. Creating a new estimate.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching lead:', error);
      toast({
        title: "Error",
        description: "Failed to load lead details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <EstimateBuilder leadData={lead} leadId={id} />;
}

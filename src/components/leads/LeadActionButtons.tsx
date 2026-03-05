import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, FileSignature, Receipt, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadActionButtonsProps {
  leadId: string;
  leadName: string;
  leadEmail?: string | null;
  leadLocation?: string | null;
  projectType: string;
  estimatedBudget?: string | null;
  saleOutcome?: string | null;
  isReadonly?: boolean;
}

export function LeadActionButtons({
  leadId,
  leadName,
  leadEmail,
  leadLocation,
  projectType,
  estimatedBudget,
  saleOutcome,
  isReadonly = false,
}: LeadActionButtonsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creatingContract, setCreatingContract] = useState(false);

  const handleCreateEstimate = () => {
    navigate(`/estimator/prepare-estimate/${leadId}`);
  };

  const handleGenerateContract = async () => {
    setCreatingContract(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if contractor project exists for this lead
      let { data: existingProject } = await supabase
        .from('contractor_projects')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle();

      let projectId = existingProject?.id;

      // Create contractor project if it doesn't exist
      if (!projectId) {
        const { data: newProject, error: projectError } = await supabase
          .from('contractor_projects')
          .insert({
            contractor_id: user.id,
            project_name: projectType,
            client_name: leadName,
            location: leadLocation || 'TBD',
            project_type: projectType,
            description: `Project created from lead: ${leadName}`,
            status: 'planning',
            lead_id: leadId,
          })
          .select()
          .single();

        if (projectError) throw projectError;
        projectId = newProject.id;
      }

      // Navigate to contract creation with project pre-selected
      navigate(`/finance/contract/new?projectId=${projectId}`);
      
      toast({
        title: "Ready to Create Contract",
        description: "Fill in the contract details for this project.",
      });
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare contract",
        variant: "destructive",
      });
    } finally {
      setCreatingContract(false);
    }
  };

  const isSold = saleOutcome === 'sold';

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateEstimate}
        disabled={isReadonly}
      >
        <FileText className="h-4 w-4 mr-2" />
        Create Estimate
      </Button>

      {isSold && (
        <Button
          size="sm"
          onClick={handleGenerateContract}
          disabled={isReadonly || creatingContract}
          className="bg-success hover:bg-success/90 text-success-foreground"
        >
          {creatingContract ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSignature className="h-4 w-4 mr-2" />
          )}
          Generate Contract
        </Button>
      )}
    </div>
  );
}

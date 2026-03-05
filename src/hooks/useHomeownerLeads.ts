import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homeownerLeadService } from "@/services/homeownerLeadService";
import { toast } from "sonner";

export const useCreateHomeownerLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: homeownerLeadService.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeowner-leads'] });
      toast.success('Your project request has been submitted!');
    },
    onError: (error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });
};

export const useHomeownerLeads = (filters?: {
  status?: string;
  lead_source?: string;
  county?: string;
}) => {
  return useQuery({
    queryKey: ['homeowner-leads', filters],
    queryFn: () => homeownerLeadService.getLeads(filters),
  });
};

export const useHomeownerLead = (leadId: string) => {
  return useQuery({
    queryKey: ['homeowner-lead', leadId],
    queryFn: () => homeownerLeadService.getLead(leadId),
    enabled: !!leadId,
  });
};

export const useUpdateHomeownerLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, updates }: { leadId: string; updates: any }) =>
      homeownerLeadService.updateLead(leadId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeowner-leads'] });
      toast.success('Lead updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });
};

export const useAttributionStats = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['attribution-stats', dateRange],
    queryFn: () => homeownerLeadService.getAttributionStats(dateRange),
  });
};

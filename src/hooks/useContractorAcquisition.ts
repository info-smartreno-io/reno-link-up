import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractorAcquisitionService } from "@/services/contractorAcquisition";
import { toast } from "sonner";
import type { ContractorLead, ContractorOnboarding, ContractorReferral } from "@/types/contractor-acquisition";

export const useContractorLeads = (filters?: {
  status?: string;
  minQualityScore?: number;
  specialties?: string[];
}) => {
  return useQuery({
    queryKey: ['contractor-leads', filters],
    queryFn: () => contractorAcquisitionService.getContractorLeads(filters),
  });
};

export const useCreateContractorLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lead: Partial<ContractorLead>) =>
      contractorAcquisitionService.createContractorLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-leads'] });
      toast.success('Contractor lead created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create contractor lead: ${error.message}`);
    },
  });
};

export const useUpdateContractorLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ContractorLead> }) =>
      contractorAcquisitionService.updateContractorLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-leads'] });
      toast.success('Contractor lead updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update contractor lead: ${error.message}`);
    },
  });
};

export const useTriggerOutreach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractorLeadId, outreachType }: { 
      contractorLeadId: string; 
      outreachType: 'email' | 'sms' | 'both' 
    }) =>
      contractorAcquisitionService.triggerOutreach(contractorLeadId, outreachType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-leads'] });
      toast.success('Outreach sent successfully');
    },
    onError: (error) => {
      toast.error(`Failed to send outreach: ${error.message}`);
    },
  });
};

export const useCalculateQualityScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractorLeadId: string) =>
      contractorAcquisitionService.calculateQualityScore(contractorLeadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-leads'] });
      toast.success('Quality score calculated');
    },
    onError: (error) => {
      toast.error(`Failed to calculate quality score: ${error.message}`);
    },
  });
};

export const useContractorOnboarding = (contractorId: string) => {
  return useQuery({
    queryKey: ['contractor-onboarding', contractorId],
    queryFn: () => contractorAcquisitionService.getContractorOnboarding(contractorId),
    enabled: !!contractorId,
  });
};

export const useUpdateContractorOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractorId, updates }: { 
      contractorId: string; 
      updates: Partial<ContractorOnboarding> 
    }) =>
      contractorAcquisitionService.updateContractorOnboarding(contractorId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contractor-onboarding', variables.contractorId] });
      toast.success('Onboarding progress updated');
    },
    onError: (error) => {
      toast.error(`Failed to update onboarding: ${error.message}`);
    },
  });
};

export const useCreateReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (referral: Omit<ContractorReferral, 'id' | 'created_at' | 'updated_at'>) =>
      contractorAcquisitionService.createReferral(referral),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-referrals'] });
      toast.success('Referral invitation sent');
    },
    onError: (error) => {
      toast.error(`Failed to create referral: ${error.message}`);
    },
  });
};

export const useContractorReferrals = (contractorId: string) => {
  return useQuery({
    queryKey: ['contractor-referrals', contractorId],
    queryFn: () => contractorAcquisitionService.getContractorReferrals(contractorId),
    enabled: !!contractorId,
  });
};

export const useBulkImportLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leads: Partial<ContractorLead>[]) =>
      contractorAcquisitionService.bulkImportLeads(leads),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contractor-leads'] });
      toast.success(`Successfully imported ${data.length} contractor leads`);
    },
    onError: (error) => {
      toast.error(`Failed to import leads: ${error.message}`);
    },
  });
};

export const useAcquisitionStats = () => {
  return useQuery({
    queryKey: ['acquisition-stats'],
    queryFn: () => contractorAcquisitionService.getAcquisitionStats(),
  });
};

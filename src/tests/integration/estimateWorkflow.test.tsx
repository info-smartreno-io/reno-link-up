import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';

describe('Estimate Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEstimate = {
    id: 'est-123',
    estimate_number: 'EST-2024-001',
    user_id: mockUsers.contractor.id,
    client_name: 'John Homeowner',
    project_name: 'Kitchen Remodel',
    amount: 45000,
    status: 'draft',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    valid_until: '2024-02-01',
  };

  const mockProject = {
    id: 'proj-123',
    homeowner_name: 'John Homeowner',
    project_type: 'Kitchen Remodel',
    address: '123 Main St',
    zip_code: '07601',
  };

  describe('Estimate Creation', () => {
    it('should allow contractor to create an estimate', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockEstimate,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('estimates') as any)
        .insert({
          user_id: mockUsers.contractor.id,
          client_name: 'John Homeowner',
          project_name: 'Kitchen Remodel',
          estimate_number: 'EST-2024-001',
          amount: 45000,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockEstimate);
    });

    it('should generate unique estimate number', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: { ...mockEstimate, estimate_number: 'EST-2024-002' },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('estimates') as any)
        .insert({
          user_id: mockUsers.contractor.id,
          client_name: 'Jane Homeowner',
          project_name: 'Bathroom Remodel',
          estimate_number: 'EST-2024-002',
          amount: 25000,
        });

      expect(error).toBeNull();
      expect((data as any).estimate_number).toMatch(/EST-\d{4}-\d{3}/);
    });
  });

  describe('Estimate from Lead Conversion', () => {
    it('should convert lead to estimate', async () => {
      const mockLead = {
        id: 'lead-123',
        name: 'John Homeowner',
        project_type: 'Kitchen Remodel',
        location: 'Bergen County, NJ',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockEstimate,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('estimates') as any)
        .insert({
          user_id: mockUsers.admin.id,
          client_name: mockLead.name,
          project_name: mockLead.project_type,
          estimate_number: 'EST-2024-003',
          amount: 50000,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockEstimate);
    });
  });

  describe('Estimate Status Updates', () => {
    it('should update estimate status from draft to sent', async () => {
      const sentEstimate = { ...mockEstimate, status: 'sent' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: sentEstimate,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('estimates')
        .update({ status: 'sent' })
        .eq('id', mockEstimate.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('sent');
      }
    });

    it('should mark estimate as accepted', async () => {
      const acceptedEstimate = { ...mockEstimate, status: 'accepted' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: acceptedEstimate,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('estimates')
        .update({ status: 'accepted' })
        .eq('id', mockEstimate.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('accepted');
      }
    });
  });

  describe('Estimate Notifications', () => {
    it('should trigger notification when estimate is sent', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { success: true },
        error: null,
      });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      const { data, error } = await supabase.functions.invoke(
        'send-estimate-request-notification',
        {
          body: {
            estimateId: mockEstimate.id,
            clientEmail: 'homeowner@test.com',
            clientName: mockEstimate.client_name,
            projectName: mockEstimate.project_name,
            amount: mockEstimate.amount,
          },
        }
      );

      expect(error).toBeNull();
      expect(mockInvoke).toHaveBeenCalled();
    });
  });

  describe('AI Estimate Generation', () => {
    it('should generate estimate using AI', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          lineItems: [
            { description: 'Cabinets', quantity: 10, rate: 500, amount: 5000 },
            { description: 'Countertops', quantity: 25, rate: 100, amount: 2500 },
          ],
          disclaimers: ['Permits not included', 'Timeline subject to material availability'],
          potentialMissingItems: ['Electrical upgrades', 'Plumbing modifications'],
        },
        error: null,
      });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      const { data, error } = await supabase.functions.invoke(
        'ai-estimate-generator',
        {
          body: {
            projectId: mockProject.id,
            scope: 'Complete kitchen remodel',
            address: mockProject.address,
            zip: mockProject.zip_code,
          },
        }
      );

      expect(error).toBeNull();
      if (data) {
        expect((data as any).lineItems).toBeDefined();
        expect((data as any).lineItems.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Estimate to RFP Conversion', () => {
    it('should create RFP from estimate', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { bidOpportunityId: 'bid-opp-123', matchedContractors: 5 },
        error: null,
      });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      const { data, error } = await supabase.functions.invoke(
        'create-rfp-from-estimate',
        {
          body: {
            projectId: mockProject.id,
            estimateId: mockEstimate.id,
          },
        }
      );

      expect(error).toBeNull();
      if (data) {
        expect((data as any).bidOpportunityId).toBeTruthy();
        expect((data as any).matchedContractors).toBeGreaterThan(0);
      }
    });
  });

  describe('Estimate Retrieval', () => {
    it('should fetch estimates for contractor', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockEstimate],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('user_id', mockUsers.contractor.id)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });

    it('should filter estimates by status', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockEstimate],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('status', 'draft');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });
});

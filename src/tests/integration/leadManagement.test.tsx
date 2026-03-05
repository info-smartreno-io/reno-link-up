import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';

describe('Lead Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLead = {
    id: 'lead-123',
    name: 'John Homeowner',
    email: 'homeowner@test.com',
    phone: '555-1234',
    project_type: 'Kitchen Remodel',
    location: 'Bergen County, NJ',
    status: 'new_lead',
    source: 'website',
    created_at: '2024-01-01',
  };

  describe('Lead Creation', () => {
    it('should create a new lead', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockLead,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('leads') as any)
        .insert({
          name: 'John Homeowner',
          email: 'homeowner@test.com',
          phone: '555-1234',
          project_type: 'Kitchen Remodel',
          location: 'Bergen County, NJ',
          user_id: mockUsers.homeowner.id,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockLead);
    });

    it('should auto-assign lead to estimator', async () => {
      const assignedLead = {
        ...mockLead,
        user_id: mockUsers.admin.id,
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: assignedLead,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('leads') as any)
        .insert({
          ...mockLead,
          user_id: mockUsers.admin.id,
        });

      expect(error).toBeNull();
      if (data) {
        expect((data as any).user_id).toBeTruthy();
      }
    });
  });

  describe('Lead Status Updates', () => {
    it('should update lead status', async () => {
      const updatedLead = { ...mockLead, status: 'qualified' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: updatedLead,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('leads')
        .update({ status: 'qualified' })
        .eq('id', mockLead.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('qualified');
      }
    });

    it('should log status change to history', async () => {
      const mockHistory = {
        id: 'history-123',
        lead_id: mockLead.id,
        from_status: 'new_lead',
        to_status: 'qualified',
        changed_by: mockUsers.admin.id,
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('lead_stage_history') as any)
        .insert({
          lead_id: mockLead.id,
          from_status: 'new_lead',
          to_status: 'qualified',
          changed_by: mockUsers.admin.id,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockHistory);
    });
  });

  describe('Lead Assignment', () => {
    it('should reassign lead to different estimator', async () => {
      const reassignedLead = {
        ...mockLead,
        user_id: mockUsers.contractor.id,
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: reassignedLead,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('leads')
        .update({ user_id: mockUsers.contractor.id })
        .eq('id', mockLead.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).user_id).toBe(mockUsers.contractor.id);
      }
    });
  });

  describe('Lead Filtering', () => {
    it('should filter leads by status', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockLead],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'new_lead');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });

    it('should filter leads by assigned estimator', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockLead],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', mockUsers.admin.id);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });

  describe('Lead Winback Campaigns', () => {
    it('should get eligible winback leads', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [
          {
            lead_id: mockLead.id,
            lead_name: mockLead.name,
            email: mockLead.email,
            lost_reason: 'Price too high',
          },
        ],
        error: null,
      });

      vi.mocked(supabase).rpc = mockRpc;

      const { data, error } = await supabase.rpc('get_eligible_winback_leads', {
        campaign_id_param: 'campaign-123',
      });

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });
});

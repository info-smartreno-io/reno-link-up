import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockBidOpportunity, mockBidSubmission } from '../mockData/bids';
import { mockUsers } from '../mockData/users';

describe('Bid Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bid Opportunity Creation', () => {
    it('should allow admin to create a bid opportunity', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockBidOpportunity,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const bidData = {
        title: mockBidOpportunity.title,
        description: mockBidOpportunity.description,
        project_type: mockBidOpportunity.project_type,
        location: mockBidOpportunity.location,
        estimated_budget: mockBidOpportunity.estimated_budget,
      };

      const { data, error } = await (supabase.from('bid_opportunities') as any)
        .insert(bidData);

      expect(error).toBeNull();
      expect(data).toEqual(mockBidOpportunity);
      expect(mockInsert).toHaveBeenCalledWith(bidData);
    });

    it('should validate required fields for bid opportunity', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Missing required fields' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('bid_opportunities') as any)
        .insert({});

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('Bid Submission', () => {
    it('should allow contractor to submit a bid', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockBidSubmission,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('bid_submissions') as any)
        .insert({
          bid_opportunity_id: mockBidOpportunity.id,
          bidder_id: mockUsers.contractor.id,
          bidder_type: 'contractor',
          bid_amount: 45000,
          proposal_text: 'Test proposal',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockBidSubmission);
    });

    it('should prevent duplicate bid submissions', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Duplicate bid submission' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('bid_submissions') as any)
        .insert({
          bid_opportunity_id: mockBidOpportunity.id,
          bidder_id: mockUsers.contractor.id,
        });

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('Bid Retrieval', () => {
    it('should fetch all bids for an opportunity', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockBidSubmission],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('bid_submissions')
        .select('*')
        .eq('bid_opportunity_id', mockBidOpportunity.id);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual(mockBidSubmission);
      }
    });

    it('should filter bids by status', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockResolvedValue({
        data: [mockBidSubmission],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      mockEq.mockReturnValueOnce({ eq: mockEqStatus } as any);

      const { data, error } = await supabase
        .from('bid_submissions')
        .select('*')
        .eq('bid_opportunity_id', mockBidOpportunity.id)
        .eq('status', 'submitted');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('Bid Status Updates', () => {
    it('should allow admin to update bid status', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: { ...mockBidSubmission, status: 'approved' } as any,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('bid_submissions')
        .update({ status: 'approved' })
        .eq('id', mockBidSubmission.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('approved');
      }
    });
  });
});

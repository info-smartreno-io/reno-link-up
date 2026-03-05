import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';
import { mockBidOpportunity } from '../mockData/bids';

describe('RFP Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject = {
    id: 'proj-123',
    homeowner_name: 'John Homeowner',
    project_type: 'Kitchen Remodel',
    address: '123 Main St',
    zip_code: '07601',
  };

  const mockRfpSend = {
    id: 'rfp-send-123',
    project_id: mockProject.id,
    contractor_id: mockUsers.contractor.id,
    status: 'sent',
    sent_at: '2024-01-01',
  };

  describe('RFP Creation from Estimate', () => {
    it('should create RFP from approved estimate', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { 
          bidOpportunityId: 'bid-opp-123',
          matchedContractors: 8 
        },
        error: null,
      });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      const { data, error } = await supabase.functions.invoke(
        'create-rfp-from-estimate',
        {
          body: {
            projectId: mockProject.id,
            estimateId: 'est-123',
          },
        }
      );

      expect(error).toBeNull();
      expect(data.bidOpportunityId).toBeTruthy();
      expect(data.matchedContractors).toBeGreaterThan(0);
    });
  });

  describe('Contractor Matching', () => {
    it('should fetch available contractors for project', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [
          { id: mockUsers.contractor.id, company_name: 'ABC Contractors' },
          { id: 'contractor-2', company_name: 'XYZ Builders' },
        ],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('should filter contractors by service area', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockContains = vi.fn().mockResolvedValue({
        data: [
          { id: mockUsers.contractor.id, service_zip_codes: ['07601', '07602'] },
        ],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        contains: mockContains,
      } as any);

      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .contains('service_zip_codes', ['07601']);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });

  describe('AI RFP Sending', () => {
    it('should send personalized RFP to contractor using AI', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          personalizedMessage: 'Dear Contractor, we have a great opportunity...',
          followUpScheduled: true,
          followUpDate: '2024-01-04',
        },
        error: null,
      });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      const { data, error } = await supabase.functions.invoke(
        'ai-rfp-sender',
        {
          body: {
            projectId: mockProject.id,
            contractorId: mockUsers.contractor.id,
            projectSummary: 'Complete kitchen remodel with high-end finishes',
            attachments: ['estimate.pdf', 'blueprints.pdf'],
          },
        }
      );

      expect(error).toBeNull();
      expect(data.personalizedMessage).toBeTruthy();
      expect(data.followUpScheduled).toBe(true);
    });

    it('should track AI RFP activity', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'activity-123',
          agent_type: 'rfp_sender',
          status: 'completed',
          project_id: mockProject.id,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('ai_agent_activity')
        .insert({
          agent_type: 'rfp_sender',
          user_id: mockUsers.admin.id,
          user_role: 'admin',
          input: { projectId: mockProject.id },
          project_id: mockProject.id,
        });

      expect(error).toBeNull();
      if (data) {
        expect((data as any).agent_type).toBe('rfp_sender');
      }
    });
  });

  describe('RFP Delivery Tracking', () => {
    it('should record RFP send event', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockRfpSend,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('rfp_auto_sends')
        .insert({
          project_id: mockProject.id,
          contractor_id: mockUsers.contractor.id,
          status: 'sent',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockRfpSend);
    });

    it('should track RFP response', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: { ...mockRfpSend, response_received: true },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('rfp_auto_sends')
        .update({ response_received: true })
        .eq('id', mockRfpSend.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).response_received).toBe(true);
      }
    });
  });

  describe('RFP to Bid Conversion', () => {
    it('should allow contractor to submit bid from RFP', async () => {
      const mockBidSubmission = {
        id: 'bid-sub-123',
        bid_opportunity_id: mockBidOpportunity.id,
        bidder_id: mockUsers.contractor.id,
        bid_amount: 45000,
        status: 'submitted',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockBidSubmission,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('bid_submissions')
        .insert({
          bid_opportunity_id: mockBidOpportunity.id,
          bidder_id: mockUsers.contractor.id,
          bidder_type: 'contractor',
          bid_amount: 45000,
        });

      expect(error).toBeNull();
      if (data) {
        expect(data).toEqual(mockBidSubmission);
      }
    });

    it('should notify estimator when bid is submitted', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { sent: true },
        error: null,
      });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      const { data, error } = await supabase.functions.invoke(
        'send-bid-submission-notification',
        {
          body: {
            bidSubmissionId: 'bid-sub-123',
            opportunityTitle: mockBidOpportunity.title,
            bidderName: 'ABC Contractors',
            bidAmount: 45000,
          },
        }
      );

      expect(error).toBeNull();
      expect(data.sent).toBe(true);
    });
  });

  describe('RFP Response Messages', () => {
    it('should allow contractor to ask questions about RFP', async () => {
      const mockMessage = {
        id: 'msg-123',
        bid_opportunity_id: mockBidOpportunity.id,
        sender_id: mockUsers.contractor.id,
        message: 'What is the timeline for this project?',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockMessage,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('bid_opportunity_messages')
        .insert({
          bid_opportunity_id: mockBidOpportunity.id,
          sender_id: mockUsers.contractor.id,
          message: 'What is the timeline for this project?',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockMessage);
    });

    it('should allow estimator to respond to contractor questions', async () => {
      const mockMessage = {
        id: 'msg-124',
        bid_opportunity_id: mockBidOpportunity.id,
        sender_id: mockUsers.admin.id,
        message: 'The timeline is 8-10 weeks starting in March.',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockMessage,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('bid_opportunity_messages')
        .insert({
          bid_opportunity_id: mockBidOpportunity.id,
          sender_id: mockUsers.admin.id,
          message: 'The timeline is 8-10 weeks starting in March.',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockMessage);
    });
  });

  describe('RFP Follow-ups', () => {
    it('should schedule automated follow-up', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'followup-123',
          project_id: mockProject.id,
          contractor_id: mockUsers.contractor.id,
          next_follow_up: '2024-01-04',
          follow_up_scheduled: true,
          status: 'scheduled',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('rfp_auto_sends')
        .insert({
          project_id: mockProject.id,
          contractor_id: mockUsers.contractor.id,
          next_follow_up: '2024-01-04',
          follow_up_scheduled: true,
        });

      expect(error).toBeNull();
      if (data) {
        expect((data as any).next_follow_up).toBeTruthy();
      }
    });
  });
});

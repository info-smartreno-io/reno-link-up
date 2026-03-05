import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';
import { mockBidOpportunity } from '../mockData/bids';

describe('Messaging System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMessage = {
    id: 'msg-123',
    bid_opportunity_id: mockBidOpportunity.id,
    sender_id: mockUsers.contractor.id,
    message: 'Hello, I have a question about the project',
    created_at: '2024-01-01',
  };

  describe('Bid Opportunity Messages', () => {
    it('should allow sending a message', async () => {
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
          message: 'Hello, I have a question about the project',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockMessage);
    });

    it('should fetch messages for a bid opportunity', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockMessage],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const { data, error } = await supabase
        .from('bid_opportunity_messages')
        .select('*')
        .eq('bid_opportunity_id', mockBidOpportunity.id)
        .order('created_at', { ascending: true });

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });

    it('should support message attachments', async () => {
      const mockAttachment = {
        id: 'attach-123',
        message_id: mockMessage.id,
        file_name: 'blueprint.pdf',
        file_path: 'path/to/file',
        file_size: 1024000,
        file_type: 'application/pdf',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockAttachment,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('bid_message_attachments')
        .insert({
          message_id: mockMessage.id,
          file_name: 'blueprint.pdf',
          file_path: 'path/to/file',
          file_size: 1024000,
          file_type: 'application/pdf',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockAttachment);
    });
  });

  describe('Contractor Messages', () => {
    const contractorMessage = {
      id: 'cmsg-123',
      contractor_id: mockUsers.contractor.id,
      message: 'Project update',
      sender_name: 'Admin',
      is_read: false,
      created_at: '2024-01-01',
    };

    it('should send message to contractor', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: contractorMessage,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractor_messages')
        .insert({
          contractor_id: mockUsers.contractor.id,
          message: 'Project update',
          sender_name: 'Admin',
        });

      expect(error).toBeNull();
      expect(data).toEqual(contractorMessage);
    });

    it('should mark message as read', async () => {
      const readMessage = { ...contractorMessage, is_read: true };
      
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: readMessage,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_messages')
        .update({ is_read: true })
        .eq('id', contractorMessage.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).is_read).toBe(true);
      }
    });
  });

  describe('Real-time Message Updates', () => {
    it('should subscribe to new messages', () => {
      const mockOn = vi.fn().mockReturnThis();
      const mockSubscribe = vi.fn();
      const mockChannel = vi.fn().mockReturnValue({
        on: mockOn,
        subscribe: mockSubscribe,
      });

      vi.mocked(supabase.channel).mockImplementation(mockChannel);

      const channel = supabase
        .channel('messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public' }, () => {})
        .subscribe();

      expect(mockChannel).toHaveBeenCalledWith('messages');
      expect(mockOn).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });
});

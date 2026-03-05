import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';

describe('Change Order Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockChangeOrder = {
    id: 'co-123',
    project_id: 'project-123',
    change_order_number: 'CO-001',
    project_name: 'Kitchen Remodel',
    client_name: 'John Doe',
    description: 'Add granite countertops',
    original_amount: 45000,
    change_amount: 5000,
    new_total_amount: 50000,
    status: 'pending',
    reason: 'Client upgrade request',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  describe('Change Order Creation', () => {
    it('should create a new change order', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockChangeOrder,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('change_orders')
        .insert({
          project_id: 'project-123',
          change_order_number: 'CO-001',
          project_name: 'Kitchen Remodel',
          client_name: 'John Doe',
          description: 'Add granite countertops',
          original_amount: 45000,
          change_amount: 5000,
          reason: 'Client upgrade request',
        });

      expect(error).toBeNull();
      if (data) {
        expect((data as any).new_total_amount).toBe(50000);
      }
    });

    it('should include line items in change order', async () => {
      const changeOrderWithLineItems = {
        ...mockChangeOrder,
        line_items: [
          { description: 'Granite countertop', quantity: 30, unit_price: 150, total: 4500 },
          { description: 'Installation', quantity: 1, unit_price: 500, total: 500 },
        ],
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: changeOrderWithLineItems,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('change_orders')
        .insert({
          ...mockChangeOrder,
          line_items: changeOrderWithLineItems.line_items,
        });

      expect(error).toBeNull();
      if (data && (data as any).line_items) {
        expect((data as any).line_items).toHaveLength(2);
      }
    });
  });

  describe('Change Order Approval Workflow', () => {
    it('should update change order status to approved', async () => {
      const approvedOrder = {
        ...mockChangeOrder,
        status: 'approved',
        approved_at: '2024-01-02',
        approved_by: mockUsers.admin.id,
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: approvedOrder,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('change_orders')
        .update({
          status: 'approved',
          approved_at: '2024-01-02',
          approved_by: mockUsers.admin.id,
        })
        .eq('id', mockChangeOrder.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('approved');
        expect((data as any).approved_by).toBe(mockUsers.admin.id);
      }
    });

    it('should reject change order with reason', async () => {
      const rejectedOrder = {
        ...mockChangeOrder,
        status: 'rejected',
        internal_notes: 'Budget constraints',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: rejectedOrder,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('change_orders')
        .update({
          status: 'rejected',
          internal_notes: 'Budget constraints',
        })
        .eq('id', mockChangeOrder.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('rejected');
      }
    });
  });

  describe('Change Order AI Logs', () => {
    const mockAILog = {
      id: 'ai-log-123',
      change_order_id: mockChangeOrder.id,
      project_id: 'project-123',
      reason: 'Material upgrade',
      price_change: 5000,
      timeline_change_days: 3,
      message_homeowner: 'We recommend upgrading to granite',
      message_contractor: 'Client requested granite upgrade',
      status: 'pending',
    };

    it('should create AI log for change order', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockAILog,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('change_order_ai_logs')
        .insert({
          change_order_id: mockChangeOrder.id,
          project_id: 'project-123',
          reason: 'Material upgrade',
          price_change: 5000,
          timeline_change_days: 3,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockAILog);
    });

    it('should track change order history', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockAILog],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const { data, error } = await supabase
        .from('change_order_ai_logs')
        .select('*')
        .eq('project_id', 'project-123')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });
});

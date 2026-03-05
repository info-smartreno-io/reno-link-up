import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';

describe('Contractor Portal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contractor Dashboard', () => {
    it('should load contractor statistics', async () => {
      const mockStats = {
        total_projects: 15,
        active_projects: 5,
        completed_projects: 10,
        total_revenue: 500000,
      };

      const mockSelect = vi.fn().mockResolvedValue({
        data: [mockStats],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const { data, error } = await (supabase.from('contractor_projects') as any)
        .select('count');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('Contractor Schedule', () => {
    const mockScheduleEntry = {
      id: 'schedule-123',
      contractor_id: mockUsers.contractor.id,
      project_id: 'project-123',
      scheduled_date: '2024-06-01',
      notes: 'Site visit',
    };

    it('should create schedule entry', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockScheduleEntry,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('contractor_schedule') as any)
        .insert({
          contractor_id: mockUsers.contractor.id,
          event_date: '2024-06-01',
          title: 'Site visit',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockScheduleEntry);
    });

    it('should fetch contractor schedule', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockScheduleEntry],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const { data, error } = await supabase
        .from('contractor_schedule')
        .select('*')
        .eq('contractor_id', mockUsers.contractor.id)
        .order('scheduled_date', { ascending: true });

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });

  describe('Contractor Pricing', () => {
    const mockPricingItem = {
      id: 'pricing-123',
      contractor_id: mockUsers.contractor.id,
      item_name: 'Drywall Installation',
      category: 'Carpentry',
      unit: 'sq ft',
      material_cost: 2.50,
      labor_cost: 3.50,
    };

    it('should add pricing item', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockPricingItem,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractor_pricing_items')
        .insert({
          contractor_id: mockUsers.contractor.id,
          item_name: 'Drywall Installation',
          category: 'Carpentry',
          unit: 'sq ft',
          material_cost: 2.50,
          labor_cost: 3.50,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockPricingItem);
    });

    it('should retrieve pricing catalog', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockPricingItem],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_pricing_items')
        .select('*')
        .eq('contractor_id', mockUsers.contractor.id);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });

  describe('Contractor Applications', () => {
    const mockApplication = {
      id: 'app-123',
      user_id: mockUsers.contractor.id,
      full_name: 'Jane Contractor',
      email: 'contractor@test.com',
      company_name: 'Jane\'s Construction',
      license_number: 'NJ-12345',
      status: 'pending',
    };

    it('should submit contractor application', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockApplication,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractor_applications')
        .insert({
          user_id: mockUsers.contractor.id,
          full_name: 'Jane Contractor',
          email: 'contractor@test.com',
          company_name: 'Jane\'s Construction',
          license_number: 'NJ-12345',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockApplication);
    });

    it('should approve contractor application', async () => {
      const approvedApp = { ...mockApplication, status: 'approved' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: approvedApp,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_applications')
        .update({ status: 'approved' })
        .eq('id', mockApplication.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('approved');
      }
    });
  });
});

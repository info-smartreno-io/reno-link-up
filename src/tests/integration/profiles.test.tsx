import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockProfiles, additionalTestProfiles } from '../mockData/profiles';
import { mockUsers } from '../mockData/users';

describe('Profile Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Creation', () => {
    it('should create profile for homeowner', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockProfiles.homeowner,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: mockUsers.homeowner.id,
          full_name: 'John Homeowner',
          phone: '555-0101',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockProfiles.homeowner);
    });

    it('should create profile for contractor', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockProfiles.contractor,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: mockUsers.contractor.id,
          full_name: 'Jane Contractor',
          phone: '555-0102',
          bio: mockProfiles.contractor.bio,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockProfiles.contractor);
    });
  });

  describe('Profile Updates', () => {
    it('should update profile information', async () => {
      const updatedProfile = {
        ...mockProfiles.homeowner,
        phone: '555-9999',
        bio: 'Updated bio',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .update({ phone: '555-9999', bio: 'Updated bio' })
        .eq('id', mockUsers.homeowner.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).phone).toBe('555-9999');
      }
    });

    it('should mark profile as completed', async () => {
      const completedProfile = {
        ...additionalTestProfiles.homeowner2,
        profile_completed: true,
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: completedProfile,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .update({ profile_completed: true })
        .eq('id', 'homeowner-456');

      expect(error).toBeNull();
      if (data) {
        expect((data as any).profile_completed).toBe(true);
      }
    });
  });

  describe('Profile Retrieval', () => {
    it('should fetch profile by user id', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfiles.contractor,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mockUsers.contractor.id)
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(mockProfiles.contractor);
    });

    it('should fetch all contractor profiles', async () => {
      const contractorProfiles = [
        mockProfiles.contractor,
        additionalTestProfiles.contractor2,
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockResolvedValue({
        data: contractorProfiles,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', [mockUsers.contractor.id, 'contractor-456']);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(2);
      }
    });
  });

  describe('Profile Completion Status', () => {
    it('should filter profiles by completion status', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [
          mockProfiles.homeowner,
          mockProfiles.contractor,
          mockProfiles.admin,
        ],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_completed', true);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(3);
        expect(data.every((p: any) => p.profile_completed)).toBe(true);
      }
    });

    it('should identify incomplete profiles', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [additionalTestProfiles.homeowner2],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_completed', false);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
        expect((data[0] as any).profile_completed).toBe(false);
      }
    });
  });

  describe('Profile Search', () => {
    it('should search profiles by name', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockIlike = vi.fn().mockResolvedValue({
        data: [mockProfiles.homeowner, additionalTestProfiles.homeowner2],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Homeowner%');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(2);
      }
    });

    it('should search profiles by phone', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockProfiles.contractor],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', '555-0102');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
        expect((data[0] as any).full_name).toBe('Jane Contractor');
      }
    });
  });

  describe('Avatar Upload', () => {
    it('should update avatar URL', async () => {
      const updatedProfile = {
        ...mockProfiles.architect,
        avatar_url: 'https://example.com/avatars/architect.jpg',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: 'https://example.com/avatars/architect.jpg' })
        .eq('id', mockUsers.architect.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).avatar_url).toBeTruthy();
      }
    });
  });

  describe('Profile with Role Integration', () => {
    it('should fetch profile with associated roles', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          ...mockProfiles.admin,
          user_roles: [{ role: 'admin' }, { role: 'estimator' }],
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(*)')
        .eq('id', mockUsers.admin.id)
        .single();

      expect(error).toBeNull();
      if (data) {
        expect((data as any).user_roles).toBeDefined();
        expect((data as any).user_roles).toHaveLength(2);
      }
    });
  });
});

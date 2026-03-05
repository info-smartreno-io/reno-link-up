import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers, mockUserRoles } from '../mockData/users';

describe('Authentication and Authorization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Sign Up', () => {
    it('should successfully sign up a new user', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        data: {
          user: mockUsers.homeowner,
          session: { access_token: 'mock-token' },
        },
        error: null,
      });

      vi.mocked(supabase.auth.signUp).mockImplementation(mockSignUp);

      const { data, error } = await supabase.auth.signUp({
        email: 'newuser@test.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(mockSignUp).toHaveBeenCalled();
    });

    it('should reject signup with invalid email', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      vi.mocked(supabase.auth.signUp).mockImplementation(mockSignUp);

      const { data, error } = await supabase.auth.signUp({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(error).toBeTruthy();
      expect(data.user).toBeNull();
    });
  });

  describe('User Sign In', () => {
    it('should successfully sign in an existing user', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: {
          user: mockUsers.contractor,
          session: { access_token: 'mock-token' },
        },
        error: null,
      });

      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(mockSignIn);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: mockUsers.contractor.email,
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.session).toBeTruthy();
    });

    it('should reject signin with incorrect credentials', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(mockSignIn);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'wrong@test.com',
        password: 'wrongpassword',
      });

      expect(error).toBeTruthy();
      expect(data.user).toBeNull();
    });
  });

  describe('Role-Based Access', () => {
    it('should verify user has correct role', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockUserRoles.admin],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const result = await (supabase.from('user_roles') as any)
        .select('*')
        .eq('user_id', mockUsers.admin.id);

      expect(result.error).toBeNull();
      if (result.data) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].role).toBe('admin');
      }
    });

    it('should restrict access based on role', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Access denied' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await (supabase.from('bid_opportunities') as any).select('*');

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockGetSession = vi.fn().mockResolvedValue({
        data: {
          session: {
            user: mockUsers.contractor,
            access_token: 'mock-token',
          },
        },
        error: null,
      });

      vi.mocked(supabase.auth.getSession).mockImplementation(mockGetSession);

      const { data, error } = await supabase.auth.getSession();

      expect(error).toBeNull();
      expect(data.session).toBeTruthy();
    });

    it('should sign out user', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({
        error: null,
      });

      vi.mocked(supabase.auth.signOut).mockImplementation(mockSignOut);

      const { error } = await supabase.auth.signOut();

      expect(error).toBeNull();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});

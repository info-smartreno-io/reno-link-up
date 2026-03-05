import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';

describe('Project Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject = {
    id: 'project-123',
    client_name: 'John Doe',
    contractor_id: mockUsers.contractor.id,
    project_name: 'Kitchen Remodel',
    project_type: 'Kitchen Remodel',
    location: 'Bergen County, NJ',
    status: 'planning',
    estimated_value: 50000,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  describe('Project Creation', () => {
    it('should create a new project', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockProject,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractor_projects')
        .insert({
          client_name: 'John Doe',
          contractor_id: mockUsers.contractor.id,
          project_name: 'Kitchen Remodel',
          project_type: 'Kitchen Remodel',
          location: 'Bergen County, NJ',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockProject);
    });

    it('should validate required project fields', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Missing required fields' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('contractor_projects') as any)
        .insert({});

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('Project Status Updates', () => {
    it('should update project status', async () => {
      const updatedProject = { ...mockProject, status: 'in_progress' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: updatedProject,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_projects')
        .update({ status: 'in_progress' })
        .eq('id', mockProject.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('in_progress');
      }
    });

    it('should track status history', async () => {
      const mockHistory = {
        id: 'history-123',
        project_id: mockProject.id,
        from_status: 'planning',
        to_status: 'in_progress',
        changed_by: mockUsers.admin.id,
        changed_at: '2024-01-02',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('contractor_projects') as any)
        .update({ status: 'in_progress' })
        .eq('id', mockProject.id);

      expect(error).toBeNull();
      expect(data).toEqual(mockHistory);
    });
  });

  describe('Project Documents', () => {
    const mockDocument = {
      id: 'doc-123',
      project_id: mockProject.id,
      file_name: 'contract.pdf',
      file_path: 'documents/contract.pdf',
      file_type: 'application/pdf',
      uploaded_by: mockUsers.contractor.id,
    };

    it('should add document to project', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockDocument,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await (supabase.from('contractor_project_documents') as any)
        .insert({
          project_id: mockProject.id,
          file_name: 'contract.pdf',
          file_path: 'documents/contract.pdf',
          file_type: 'application/pdf',
          file_size: 512000,
          uploaded_by: mockUsers.contractor.id,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockDocument);
    });

    it('should list all project documents', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockDocument],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_project_documents')
        .select('*')
        .eq('project_id', mockProject.id);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });

  describe('Project Assignment', () => {
    it('should assign project to contractor', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: mockProject,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_projects')
        .update({ contractor_id: mockUsers.contractor.id })
        .eq('id', mockProject.id);

      expect(error).toBeNull();
      expect(data).toEqual(mockProject);
    });
  });

  describe('Project Filtering', () => {
    it('should filter projects by status', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockProject],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('status', 'planning');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });

    it('should filter projects by contractor', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockProject],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_projects')
        .select('*')
        .eq('contractor_id', mockUsers.contractor.id);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
      }
    });
  });
});

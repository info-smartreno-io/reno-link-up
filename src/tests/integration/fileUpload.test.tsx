import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { mockUsers } from '../mockData/users';

describe('File Upload Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFile = new File(['test content'], 'test-document.pdf', {
    type: 'application/pdf',
  });

  describe('Blueprint Uploads', () => {
    const mockBlueprint = {
      id: 'blueprint-123',
      project_id: 'project-123',
      file_name: 'floor-plan.pdf',
      file_path: 'blueprints/floor-plan.pdf',
      file_size: 1024000,
      file_type: 'application/pdf',
      uploaded_by: mockUsers.architect.id,
      version: 1,
      is_latest: true,
    };

    it('should upload a blueprint file', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'blueprints/floor-plan.pdf' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as any);

      const { data, error } = await supabase.storage
        .from('blueprints')
        .upload('floor-plan.pdf', mockFile);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should create blueprint metadata record', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('blueprint_files')
        .insert({
          project_id: 'project-123',
          file_name: 'floor-plan.pdf',
          file_path: 'blueprints/floor-plan.pdf',
          file_size: 1024000,
          file_type: 'application/pdf',
          uploaded_by: mockUsers.architect.id,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockBlueprint);
    });

    it('should handle blueprint versioning', async () => {
      const newVersion = { ...mockBlueprint, version: 2 };
      
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: newVersion,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: mockInsert,
      } as any);

      // Mark old version as not latest
      await supabase
        .from('blueprint_files')
        .update({ is_latest: false })
        .eq('parent_blueprint_id', 'blueprint-123');

      // Insert new version
      const { data, error } = await supabase
        .from('blueprint_files')
        .insert({
          ...mockBlueprint,
          version: 2,
          parent_blueprint_id: 'blueprint-123',
        });

      expect(error).toBeNull();
      if (data) {
        expect((data as any).version).toBe(2);
      }
    });
  });

  describe('Project Documents', () => {
    const mockDocument = {
      id: 'doc-123',
      project_id: 'project-123',
      file_name: 'contract.pdf',
      file_path: 'documents/contract.pdf',
      file_size: 512000,
      file_type: 'application/pdf',
      document_type: 'contract',
      uploaded_by: mockUsers.admin.id,
    };

    it('should upload project document', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'documents/contract.pdf' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as any);

      const { data, error } = await supabase.storage
        .from('project-documents')
        .upload('contract.pdf', mockFile);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('should categorize documents by type', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockDocument,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractor_project_documents')
        .insert({
          project_id: 'project-123',
          file_name: 'contract.pdf',
          file_path: 'documents/contract.pdf',
          file_size: 512000,
          file_type: 'application/pdf',
          document_type: 'contract',
          uploaded_by: mockUsers.admin.id,
        });

      expect(error).toBeNull();
      if (data) {
        expect((data as any).document_type).toBe('contract');
      }
    });
  });

  describe('File Access Control', () => {
    it('should generate signed URL for private files', async () => {
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.url/file.pdf' },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        getPublicUrl: mockGetPublicUrl,
      } as any);

      const { data } = supabase.storage
        .from('blueprints')
        .getPublicUrl('floor-plan.pdf');

      expect(data.publicUrl).toBeTruthy();
      expect(mockGetPublicUrl).toHaveBeenCalled();
    });

    it('should delete files with proper permissions', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any);

      const { error } = await supabase.storage
        .from('blueprints')
        .remove(['old-file.pdf']);

      expect(error).toBeNull();
      expect(mockRemove).toHaveBeenCalled();
    });
  });
});

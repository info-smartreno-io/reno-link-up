import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  mockContractor,
  mockContractorUsers,
  mockTeamMembers,
  mockSubcontractors,
  mockContractorProject,
  mockProjectAssignments,
  mockForemanTasks,
} from '../mockData/contractorTeam';
import { mockUsers } from '../mockData/users';

describe('Contractor Team Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contractor Company Management', () => {
    it('should create a contractor company', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockContractor,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractors')
        .insert({
          name: mockContractor.name,
          legal_name: mockContractor.legal_name,
          owner_name: mockContractor.owner_name,
          email: mockContractor.email,
          phone: mockContractor.phone,
          license_number: mockContractor.license_number,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockContractor);
    });

    it('should update contractor company details', async () => {
      const updatedContractor = {
        ...mockContractor,
        phone: '555-9999',
        service_areas: ['Bergen County', 'Essex County', 'Hudson County', 'Passaic County'],
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: updatedContractor,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractors')
        .update({ phone: '555-9999', service_areas: updatedContractor.service_areas })
        .eq('id', mockContractor.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).phone).toBe('555-9999');
      }
    });
  });

  describe('Contractor User Management', () => {
    it('should add contractor admin user', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockContractorUsers.admin,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractor_users')
        .insert({
          contractor_id: mockContractor.id,
          user_id: mockUsers.contractor.id,
          role: 'contractor_admin',
          title: 'Owner / President',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockContractorUsers.admin);
    });

    it('should add project coordinator', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockContractorUsers.projectCoordinator,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('contractor_users')
        .insert({
          contractor_id: mockContractor.id,
          user_id: 'user-coordinator-123',
          role: 'project_coordinator',
          title: 'Senior Project Coordinator',
          invited_by: mockUsers.contractor.id,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockContractorUsers.projectCoordinator);
    });

    it('should fetch all users for a contractor', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: Object.values(mockContractorUsers),
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_users')
        .select('*')
        .eq('contractor_id', mockContractor.id);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(4);
      }
    });

    it('should deactivate a contractor user', async () => {
      const deactivatedUser = {
        ...mockContractorUsers.foreman,
        is_active: false,
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: deactivatedUser,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('contractor_users')
        .update({ is_active: false })
        .eq('id', mockContractorUsers.foreman.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).is_active).toBe(false);
      }
    });
  });

  describe('Team Member Management', () => {
    it('should create team member profile', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockTeamMembers.projectManager,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          contractor_id: mockContractor.id,
          first_name: 'David',
          last_name: 'Thompson',
          email: 'david.thompson@abcconstruction.com',
          phone: '555-1002',
          role: 'project_manager',
          skills: mockTeamMembers.projectManager.skills,
          certifications: mockTeamMembers.projectManager.certifications,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockTeamMembers.projectManager);
    });

    it('should fetch team members by role', async () => {
      const foremen = [mockTeamMembers.foreman1, mockTeamMembers.foreman2];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: foremen,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('role', 'foreman');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(2);
      }
    });

    it('should update team member skills', async () => {
      const updatedMember = {
        ...mockTeamMembers.foreman1,
        skills: [...mockTeamMembers.foreman1.skills!, 'Advanced Blueprint Reading'],
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: updatedMember,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('team_members')
        .update({ skills: updatedMember.skills })
        .eq('id', mockTeamMembers.foreman1.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).skills).toContain('Advanced Blueprint Reading');
      }
    });

    it('should fetch active team members only', async () => {
      const activeMembers = Object.values(mockTeamMembers);

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: activeMembers,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('status', 'active');

      expect(error).toBeNull();
      if (data) {
        expect(data.length).toBeGreaterThan(0);
        expect(data.every((m: any) => m.status === 'active')).toBe(true);
      }
    });
  });

  describe('Subcontractor Management', () => {
    it('should add new subcontractor', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockSubcontractors.electrician,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('subcontractors')
        .insert({
          contractor_id: mockContractor.id,
          company_name: 'Volt Electric Services',
          contact_name: 'Robert Johnson',
          email: 'robert@voltelectric.com',
          phone: '555-2001',
          trade: 'Electrical',
          license_number: 'NJ-E-67890',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockSubcontractors.electrician);
    });

    it('should filter subcontractors by trade', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockSubcontractors.electrician],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('trade', 'Electrical');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(1);
        expect((data[0] as any).trade).toBe('Electrical');
      }
    });

    it('should update subcontractor rating', async () => {
      const updatedSub = {
        ...mockSubcontractors.plumber,
        rating: 5.0,
        projects_completed: 63,
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: updatedSub,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('subcontractors')
        .update({ rating: 5.0, projects_completed: 63 })
        .eq('id', mockSubcontractors.plumber.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).rating).toBe(5.0);
      }
    });

    it('should verify insurance status', async () => {
      const verifiedSubs = Object.values(mockSubcontractors).filter(
        (sub) => sub.insurance_verified
      );

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: verifiedSubs,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('insurance_verified', true);

      expect(error).toBeNull();
      if (data) {
        expect(data.length).toBe(4);
        expect(data.every((s: any) => s.insurance_verified)).toBe(true);
      }
    });
  });

  describe('Project Assignment Management', () => {
    it('should assign project manager to project', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockProjectAssignments.projectManager,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: mockContractorProject.id,
          team_member_id: mockTeamMembers.projectManager.id,
          assigned_type: 'team_member',
          role_on_project: 'Project Manager',
          status: 'active',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockProjectAssignments.projectManager);
    });

    it('should assign subcontractor to project', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockProjectAssignments.electrician,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('project_assignments')
        .insert({
          project_id: mockContractorProject.id,
          subcontractor_id: mockSubcontractors.electrician.id,
          assigned_type: 'subcontractor',
          role_on_project: 'Electrical Work',
          status: 'active',
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockProjectAssignments.electrician);
    });

    it('should fetch all assignments for a project', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: Object.values(mockProjectAssignments),
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('project_assignments')
        .select('*')
        .eq('project_id', mockContractorProject.id);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(4);
      }
    });

    it('should mark assignment as completed', async () => {
      const completedAssignment = {
        ...mockProjectAssignments.plumber,
        status: 'completed',
        end_date: '2024-02-05',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: completedAssignment,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('project_assignments')
        .update({ status: 'completed', end_date: '2024-02-05' })
        .eq('id', mockProjectAssignments.plumber.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('completed');
      }
    });
  });

  describe('Foreman Task Management', () => {
    it('should create foreman task', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockForemanTasks.demolition,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('foreman_tasks')
        .insert({
          contractor_id: mockContractor.id,
          project_id: mockContractorProject.id,
          created_by: mockTeamMembers.projectManager.user_id,
          assigned_to: [mockTeamMembers.foreman1.user_id],
          task_title: 'Kitchen Demolition',
          description: mockForemanTasks.demolition.description,
          priority: 'high',
          estimated_hours: 16,
        });

      expect(error).toBeNull();
      expect(data).toEqual(mockForemanTasks.demolition);
    });

    it('should fetch tasks assigned to specific foreman', async () => {
      const foremanTasks = [mockForemanTasks.demolition, mockForemanTasks.framing];

      const mockSelect = vi.fn().mockReturnThis();
      const mockContains = vi.fn().mockResolvedValue({
        data: foremanTasks,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        contains: mockContains,
      } as any);

      const { data, error } = await supabase
        .from('foreman_tasks')
        .select('*')
        .contains('assigned_to', [mockTeamMembers.foreman1.user_id]);

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(2);
      }
    });

    it('should update task status to in_progress', async () => {
      const inProgressTask = {
        ...mockForemanTasks.framing,
        status: 'in_progress',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: inProgressTask,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('foreman_tasks')
        .update({ status: 'in_progress' })
        .eq('id', mockForemanTasks.framing.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('in_progress');
      }
    });

    it('should complete task and record actual hours', async () => {
      const completedTask = {
        ...mockForemanTasks.demolition,
        status: 'completed',
        actual_hours: 14,
        completed_at: '2024-01-24T16:00:00Z',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: completedTask,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('foreman_tasks')
        .update({
          status: 'completed',
          actual_hours: 14,
          completed_at: '2024-01-24T16:00:00Z',
        })
        .eq('id', mockForemanTasks.demolition.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).status).toBe('completed');
        expect((data as any).actual_hours).toBe(14);
      }
    });

    it('should filter tasks by priority', async () => {
      const highPriorityTasks = [mockForemanTasks.demolition, mockForemanTasks.framing];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: highPriorityTasks,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('foreman_tasks')
        .select('*')
        .eq('priority', 'high');

      expect(error).toBeNull();
      if (data) {
        expect(data).toHaveLength(2);
        expect(data.every((t: any) => t.priority === 'high')).toBe(true);
      }
    });

    it('should mark task as blocked', async () => {
      const blockedTask = {
        ...mockForemanTasks.cabinetInstall,
        status: 'pending',
        blocked_reason: 'Waiting for cabinet delivery',
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: blockedTask,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      } as any);

      const { data, error } = await supabase
        .from('foreman_tasks')
        .update({
          status: 'pending',
          blocked_reason: 'Waiting for cabinet delivery',
        })
        .eq('id', mockForemanTasks.cabinetInstall.id);

      expect(error).toBeNull();
      if (data) {
        expect((data as any).blocked_reason).toBeTruthy();
      }
    });
  });

  describe('Cross-Team Communication', () => {
    it('should allow PM to assign task to foreman', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockForemanTasks.framing,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('foreman_tasks')
        .insert({
          contractor_id: mockContractor.id,
          project_id: mockContractorProject.id,
          created_by: mockTeamMembers.projectManager.user_id,
          assigned_to: [mockTeamMembers.foreman1.user_id],
          task_title: 'Frame New Opening',
          priority: 'high',
        });

      expect(error).toBeNull();
      if (data) {
        expect((data as any).created_by).toBe(mockTeamMembers.projectManager.user_id);
        expect((data as any).assigned_to).toContain(mockTeamMembers.foreman1.user_id);
      }
    });

    it('should track task hours for project reporting', async () => {
      const tasks = Object.values(mockForemanTasks);
      const totalEstimated = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
      const totalActual = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);

      expect(totalEstimated).toBe(52); // 16 + 12 + 24
      expect(totalActual).toBe(14); // Only completed task
    });
  });

  describe('Role-Based Access', () => {
    it('should verify contractor admin can manage all users', async () => {
      const adminUser = mockContractorUsers.admin;
      expect(adminUser.role).toBe('contractor_admin');
      expect(adminUser.is_active).toBe(true);
    });

    it('should verify project coordinator has correct permissions', async () => {
      const coordinator = mockContractorUsers.projectCoordinator;
      expect(coordinator.role).toBe('project_coordinator');
      expect(coordinator.invited_by).toBe(mockUsers.contractor.id);
    });

    it('should verify foreman can only manage assigned tasks', async () => {
      const foremanUser = mockContractorUsers.foreman;
      expect(foremanUser.role).toBe('foreman');
      
      const assignedTasks = Object.values(mockForemanTasks).filter((task) =>
        task.assigned_to?.includes(mockTeamMembers.foreman1.user_id!)
      );
      
      expect(assignedTasks.length).toBeGreaterThan(0);
    });
  });
});

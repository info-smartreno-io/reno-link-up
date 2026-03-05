/**
 * Mock SmartReno API Service
 * 
 * Provides mock data for customer portal while waiting for actual SmartReno API.
 * Feature flag: SMARTRENO_API_MODE controls whether to use mock or live data.
 */

export type SmartRenoApiMode = 'mock' | 'live';

// Configuration for API mode
export const SMARTRENO_API_MODE: SmartRenoApiMode = 
  (import.meta.env.VITE_SMARTRENO_API_MODE as SmartRenoApiMode) || 'mock';

export interface ProjectStatus {
  id: string;
  name: string;
  status: string;
  percent_complete: number;
  current_phase: string;
  start_date: string;
  estimated_completion: string;
  days_remaining: number;
}

export interface Milestone {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
  date: string;
  completed_at?: string;
}

export interface BudgetSummary {
  total: number;
  paid: number;
  remaining: number;
  next_payment?: {
    amount: number;
    due_date: string;
    milestone: string;
  };
}

export interface ProjectDetail {
  id: string;
  name: string;
  homeowner_name: string;
  project_type: string;
  address: string;
  status: string;
  percent_complete: number;
  current_phase: string;
  timeline: {
    start_date: string;
    estimated_completion: string;
    days_remaining: number;
  };
  milestones: Milestone[];
  budget: BudgetSummary;
  recent_updates: Array<{ text: string; date: string }>;
}

export interface ProjectPhoto {
  id: string;
  url: string;
  thumbnail_url: string;
  caption: string;
  category: string;
  taken_at: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  url?: string;
  status?: string;
  uploaded_at: string;
}

export interface ProjectMessage {
  id: string;
  content: string;
  sender_type: 'homeowner' | 'staff' | 'system';
  sender_name: string;
  is_from_homeowner: boolean;
  created_at: string;
}

// Mock data generators
export function getMockProjectStatus(projectId: string): ProjectStatus {
  return {
    id: projectId,
    name: "Kitchen Remodel - Smith Residence",
    status: "in_progress",
    percent_complete: 65,
    current_phase: "Electrical & Plumbing Rough-In",
    start_date: "2024-01-15",
    estimated_completion: "2024-04-30",
    days_remaining: 45,
  };
}

export function getMockProjectDetail(projectId: string): ProjectDetail {
  return {
    id: projectId,
    name: "Kitchen Remodel - Smith Residence",
    homeowner_name: "John Smith",
    project_type: "Kitchen Remodel",
    address: "123 Main Street, Anytown, NJ 07001",
    status: "in_progress",
    percent_complete: 65,
    current_phase: "Electrical & Plumbing Rough-In",
    timeline: {
      start_date: "2024-01-15",
      estimated_completion: "2024-04-30",
      days_remaining: 45,
    },
    milestones: [
      { id: "m1", name: "Demo Complete", status: "completed", date: "2024-01-22", completed_at: "2024-01-22" },
      { id: "m2", name: "Framing Complete", status: "completed", date: "2024-02-05", completed_at: "2024-02-05" },
      { id: "m3", name: "Rough-In Complete", status: "in_progress", date: "2024-02-20" },
      { id: "m4", name: "Drywall & Paint", status: "pending", date: "2024-03-10" },
      { id: "m5", name: "Cabinets & Counters", status: "pending", date: "2024-03-25" },
      { id: "m6", name: "Final Walkthrough", status: "pending", date: "2024-04-28" },
    ],
    budget: {
      total: 45000,
      paid: 27000,
      remaining: 18000,
      next_payment: {
        amount: 9000,
        due_date: "2024-02-28",
        milestone: "Rough-In Complete",
      },
    },
    recent_updates: [
      { text: "Electrical inspection passed. Moving to plumbing rough-in.", date: "2024-02-18" },
      { text: "Framing complete and approved by inspector.", date: "2024-02-05" },
      { text: "Demo completed ahead of schedule.", date: "2024-01-22" },
    ],
  };
}

export function getMockProjectPhotos(projectId: string): ProjectPhoto[] {
  return [
    {
      id: "p1",
      url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      thumbnail_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200",
      caption: "Kitchen demo complete - ready for framing",
      category: "Demo",
      taken_at: "2024-01-22",
    },
    {
      id: "p2",
      url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
      thumbnail_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200",
      caption: "New framing installed",
      category: "Framing",
      taken_at: "2024-02-05",
    },
    {
      id: "p3",
      url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800",
      thumbnail_url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200",
      caption: "Electrical rough-in progress",
      category: "Electrical",
      taken_at: "2024-02-15",
    },
    {
      id: "p4",
      url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800",
      thumbnail_url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200",
      caption: "Plumbing rough-in for island sink",
      category: "Plumbing",
      taken_at: "2024-02-18",
    },
  ];
}

export function getMockProjectDocuments(projectId: string): ProjectDocument[] {
  return [
    {
      id: "d1",
      name: "Construction Contract",
      type: "contract",
      category: "contract",
      status: "signed",
      uploaded_at: "2024-01-10",
    },
    {
      id: "d2",
      name: "Building Permit #BP-2024-1234",
      type: "permit",
      category: "permit",
      status: "approved",
      uploaded_at: "2024-01-12",
    },
    {
      id: "d3",
      name: "Invoice #INV-2024-0042",
      type: "invoice",
      category: "financial",
      status: "paid",
      uploaded_at: "2024-01-15",
    },
    {
      id: "d4",
      name: "Invoice #INV-2024-0089",
      type: "invoice",
      category: "financial",
      status: "pending",
      uploaded_at: "2024-02-15",
    },
    {
      id: "d5",
      name: "Kitchen Design Plans v2",
      type: "design",
      category: "project_document",
      url: "#",
      uploaded_at: "2024-01-08",
    },
  ];
}

export function getMockProjectMessages(projectId: string): ProjectMessage[] {
  return [
    {
      id: "msg1",
      content: "Hi! Just wanted to confirm the electrical inspection is scheduled for tomorrow at 10am.",
      sender_type: "staff",
      sender_name: "Mike Johnson (Project Manager)",
      is_from_homeowner: false,
      created_at: "2024-02-17T14:30:00Z",
    },
    {
      id: "msg2",
      content: "Thanks Mike! I'll make sure someone is home. Is there anything we need to prepare?",
      sender_type: "homeowner",
      sender_name: "John Smith",
      is_from_homeowner: true,
      created_at: "2024-02-17T15:45:00Z",
    },
    {
      id: "msg3",
      content: "No preparation needed on your end. The inspector will focus on the rough-in work. We'll send you the results as soon as we have them.",
      sender_type: "staff",
      sender_name: "Mike Johnson (Project Manager)",
      is_from_homeowner: false,
      created_at: "2024-02-17T16:00:00Z",
    },
    {
      id: "msg4",
      content: "Great news! Electrical inspection passed with no issues. Moving to plumbing rough-in this week.",
      sender_type: "staff",
      sender_name: "Mike Johnson (Project Manager)",
      is_from_homeowner: false,
      created_at: "2024-02-18T11:30:00Z",
    },
  ];
}

// Main API service that switches between mock and live
export class SmartRenoApiService {
  private mode: SmartRenoApiMode;
  private baseUrl: string;
  private portalToken: string | null = null;

  constructor(mode: SmartRenoApiMode = SMARTRENO_API_MODE) {
    this.mode = mode;
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  }

  setPortalToken(token: string) {
    this.portalToken = token;
  }

  private async fetchFromLiveAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.portalToken) {
      throw new Error('Portal token not set');
    }

    const response = await fetch(`${this.baseUrl}/functions/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-portal-token': this.portalToken,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async getProjects(): Promise<{ projects: ProjectStatus[]; homeowner: { email: string; name: string } }> {
    if (this.mode === 'mock') {
      return {
        homeowner: { email: 'john.smith@email.com', name: 'John Smith' },
        projects: [getMockProjectStatus('mock-project-1')],
      };
    }
    return this.fetchFromLiveAPI('customer-portal-projects');
  }

  async getProjectDetail(projectId: string): Promise<{ project: ProjectDetail }> {
    if (this.mode === 'mock') {
      return { project: getMockProjectDetail(projectId) };
    }
    return this.fetchFromLiveAPI(`customer-portal-project-detail?projectId=${projectId}`);
  }

  async getProjectPhotos(projectId: string): Promise<{ photos: ProjectPhoto[]; total_count: number }> {
    if (this.mode === 'mock') {
      const photos = getMockProjectPhotos(projectId);
      return { photos, total_count: photos.length };
    }
    return this.fetchFromLiveAPI(`customer-portal-photos?projectId=${projectId}`);
  }

  async getProjectDocuments(projectId: string): Promise<{ documents: ProjectDocument[]; total_count: number }> {
    if (this.mode === 'mock') {
      const documents = getMockProjectDocuments(projectId);
      return { documents, total_count: documents.length };
    }
    return this.fetchFromLiveAPI(`customer-portal-documents?projectId=${projectId}`);
  }

  async getProjectMessages(projectId: string): Promise<{ messages: ProjectMessage[]; total_count: number; unread_count: number }> {
    if (this.mode === 'mock') {
      const messages = getMockProjectMessages(projectId);
      return { messages, total_count: messages.length, unread_count: 0 };
    }
    return this.fetchFromLiveAPI(`customer-portal-messages?projectId=${projectId}`);
  }

  async sendMessage(projectId: string, message: string): Promise<{ message: ProjectMessage }> {
    if (this.mode === 'mock') {
      return {
        message: {
          id: `msg-${Date.now()}`,
          content: message,
          sender_type: 'homeowner',
          sender_name: 'You',
          is_from_homeowner: true,
          created_at: new Date().toISOString(),
        },
      };
    }
    return this.fetchFromLiveAPI(`customer-portal-messages?projectId=${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

// Singleton instance
export const smartRenoApi = new SmartRenoApiService();

import { mockUsers } from './users';

export const mockProfiles = {
  homeowner: {
    id: mockUsers.homeowner.id,
    full_name: 'John Homeowner',
    phone: '555-0101',
    bio: 'Looking to remodel my home and add value to my property.',
    avatar_url: null,
    profile_completed: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  contractor: {
    id: mockUsers.contractor.id,
    full_name: 'Jane Contractor',
    phone: '555-0102',
    bio: 'Licensed general contractor with 15+ years of experience in residential remodeling. Specializing in kitchen and bathroom renovations.',
    avatar_url: null,
    profile_completed: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  interiorDesigner: {
    id: mockUsers.interiorDesigner.id,
    full_name: 'Sarah Designer',
    phone: '555-0103',
    bio: 'Award-winning interior designer specializing in modern residential spaces. Certified by NCIDQ with expertise in sustainable design.',
    avatar_url: null,
    profile_completed: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  architect: {
    id: mockUsers.architect.id,
    full_name: 'Mike Architect',
    phone: '555-0104',
    bio: 'Licensed architect with AIA certification. Focused on residential design and custom home additions. Expert in NJ building codes and regulations.',
    avatar_url: null,
    profile_completed: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  admin: {
    id: mockUsers.admin.id,
    full_name: 'Admin User',
    phone: '555-0100',
    bio: 'Platform administrator and estimator. Managing projects and coordinating between homeowners and contractors.',
    avatar_url: null,
    profile_completed: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

// Additional test profiles for more comprehensive testing
export const additionalTestProfiles = {
  contractor2: {
    id: 'contractor-456',
    full_name: 'Bob Builder',
    phone: '555-0201',
    bio: 'Specializing in roofing and exterior work. Licensed and insured with 10 years experience.',
    avatar_url: null,
    profile_completed: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  homeowner2: {
    id: 'homeowner-456',
    full_name: 'Mary Homeowner',
    phone: '555-0202',
    bio: 'First-time home buyer looking for renovation recommendations.',
    avatar_url: null,
    profile_completed: false,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
  estimator: {
    id: 'estimator-789',
    full_name: 'Tom Estimator',
    phone: '555-0105',
    bio: 'Professional estimator with expertise in accurate cost analysis and project scoping.',
    avatar_url: null,
    profile_completed: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
};

export const allTestProfiles = {
  ...mockProfiles,
  ...additionalTestProfiles,
};

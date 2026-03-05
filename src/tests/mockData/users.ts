export const mockUsers = {
  homeowner: {
    id: 'homeowner-123',
    email: 'homeowner@test.com',
    user_metadata: {
      full_name: 'John Homeowner',
    },
  },
  contractor: {
    id: 'contractor-123',
    email: 'contractor@test.com',
    user_metadata: {
      full_name: 'Jane Contractor',
    },
  },
  interiorDesigner: {
    id: 'designer-123',
    email: 'designer@test.com',
    user_metadata: {
      full_name: 'Sarah Designer',
    },
  },
  architect: {
    id: 'architect-123',
    email: 'architect@test.com',
    user_metadata: {
      full_name: 'Mike Architect',
    },
  },
  admin: {
    id: 'admin-123',
    email: 'admin@test.com',
    user_metadata: {
      full_name: 'Admin User',
    },
  },
};

export const mockUserRoles = {
  homeowner: {
    id: 'role-1',
    user_id: 'homeowner-123',
    role: 'homeowner',
  },
  contractor: {
    id: 'role-2',
    user_id: 'contractor-123',
    role: 'contractor',
  },
  interiorDesigner: {
    id: 'role-3',
    user_id: 'designer-123',
    role: 'interior_designer',
  },
  architect: {
    id: 'role-4',
    user_id: 'architect-123',
    role: 'architect',
  },
  admin: {
    id: 'role-5',
    user_id: 'admin-123',
    role: 'admin',
  },
};

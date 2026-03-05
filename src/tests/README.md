# SmartReno Testing Suite

Comprehensive testing suite for all portals and inter-portal communications.

## Test Structure

```
src/tests/
├── setup.ts                 # Test configuration and mocks
├── utils/                   # Test utilities
│   └── testUtils.tsx       # Custom render functions
├── mockData/               # Mock data for tests
│   ├── users.ts           # User and role mocks
│   └── bids.ts            # Bid opportunity mocks
└── integration/           # Integration tests
    ├── authentication.test.tsx
    ├── bidWorkflow.test.tsx
    ├── messaging.test.tsx
    ├── fileUpload.test.tsx
    └── changeOrders.test.tsx
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with UI
```bash
npm run test:ui
```

## Test Categories

### 1. Authentication Tests (`authentication.test.tsx`)
- User sign up and sign in
- Role-based access control
- Session management
- Permission validation

### 2. Bid Workflow Tests (`bidWorkflow.test.tsx`)
- Bid opportunity creation
- Bid submission
- Bid comparison
- Status updates
- Multi-role access

### 3. Messaging Tests (`messaging.test.tsx`)
- Bid opportunity messages
- Contractor messages
- Message attachments
- Real-time updates
- Read receipts

### 4. File Upload Tests (`fileUpload.test.tsx`)
- Blueprint uploads
- Project documents
- File versioning
- Access control
- File categorization

### 5. Change Order Tests (`changeOrders.test.tsx`)
- Change order creation
- Approval workflow
- Line items
- AI logs
- Status tracking

### 6. Project Management Tests (`projectManagement.test.tsx`)
- Project creation and validation
- Status updates and tracking
- Document management
- Project assignment
- Filtering and querying

### 7. Edge Function Tests (`edgeFunctions.test.tsx`)
- Email notifications
- AI functions
- Error handling
- Rate limiting

### 8. Contractor Portal Tests (`contractorPortal.test.tsx`)
- Dashboard statistics
- Schedule management
- Pricing catalog
- Application workflow

### 9. Lead Management Tests (`leadManagement.test.tsx`)
- Lead creation and assignment
- Status updates and history
- Lead reassignment
- Filtering and winback campaigns
- Bid opportunity creation
- Bid submission
- Bid comparison
- Status updates
- Multi-role access

### 3. Messaging Tests
- Bid opportunity messages
- Contractor messages
- Message attachments
- Real-time updates
- Read receipts

### 4. File Upload Tests
- Blueprint uploads
- Project documents
- File versioning
- Access control
- File categorization

### 5. Change Order Tests
- Change order creation
- Approval workflow
- Line items
- AI logs
- Status tracking

## Portal Coverage

### Homeowner Portal
- ✅ Project intake
- ✅ Bid viewing
- ✅ Messaging
- ✅ Change order review
- ✅ Lead submission

### Contractor Portal
- ✅ Bid submissions
- ✅ Project management
- ✅ Messaging
- ✅ Document uploads
- ✅ Schedule management
- ✅ Pricing catalog
- ✅ Application workflow

### Interior Designer Portal
- ✅ Bid room access
- ✅ Project schedule
- ✅ Client selections
- ✅ Messaging

### Architect Portal
- ✅ Proposal submissions
- ✅ Blueprint management
- ✅ Project tracking
- ✅ Versioning

### Admin Portal
- ✅ Application reviews
- ✅ Bid comparisons
- ✅ User management
- ✅ Optimization tools
- ✅ Lead management
- ✅ Status tracking

## Cross-Portal Integration Tests

- ✅ Bid workflow (Admin → Contractor/Designer/Architect)
- ✅ Messaging (All portals)
- ✅ File sharing (Architect → Admin → Contractor)
- ✅ Change orders (Contractor → Admin → Homeowner)
- ✅ Project assignments (Admin → Contractor)
- ✅ Lead routing (Homeowner → Admin → Estimator)

## Mocking Strategy

### Supabase Client
All Supabase operations are mocked in `setup.ts`:
- Authentication methods
- Database queries
- Storage operations
- Real-time subscriptions

### Router
React Router is mocked to prevent navigation during tests.

### Toast Notifications
Toast notifications are mocked to verify user feedback.

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: Tests clean up after themselves using `afterEach`
3. **Mocking**: External dependencies are properly mocked
4. **Coverage**: Aim for >80% code coverage
5. **Assertions**: Use clear, descriptive assertions

## Adding New Tests

1. Create test file in appropriate category
2. Import required utilities and mocks
3. Use `describe` blocks for organization
4. Write clear test descriptions
5. Follow AAA pattern (Arrange, Act, Assert)

Example:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something specific', async () => {
    // Arrange
    const mockData = { ... };
    
    // Act
    const result = await someFunction();
    
    // Assert
    expect(result).toEqual(expected);
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment

## Troubleshooting

### Tests Failing Locally
1. Clear node_modules and reinstall
2. Check Node version (>=18.0.0)
3. Verify all dependencies are installed

### Mock Issues
1. Check mock setup in `setup.ts`
2. Verify mock implementation matches actual API
3. Clear vi mocks with `vi.clearAllMocks()`

### Async Issues
1. Always use `async/await`
2. Use `waitFor` for async assertions
3. Check promise resolution

## Future Enhancements

- [ ] E2E tests with Playwright/Cypress
- [ ] Performance tests for large datasets
- [ ] Load tests for edge functions
- [ ] Visual regression tests
- [ ] Accessibility (a11y) tests
- [ ] Component unit tests for UI elements
- [ ] Integration tests for payment workflows
- [ ] Security penetration tests
- [ ] Mobile responsiveness tests

## Test Metrics

Current coverage:
- **9 integration test suites**
- **60+ individual test cases**
- **5 portal types covered**
- **6 cross-portal workflows tested**
- **Edge function testing included**

Target coverage: >80% for critical paths

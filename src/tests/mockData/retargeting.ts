/**
 * Mock data for retargeting and conversion tracking tests
 */

export const mockConversionEvents = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    event_type: 'page_view',
    event_category: 'navigation',
    session_id: 'session-123',
    lead_source: 'organic',
    page_path: '/',
    page_title: 'Home',
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    event_type: 'intake_start',
    event_category: 'homeowner',
    session_id: 'session-123',
    lead_source: 'organic',
    page_path: '/estimate',
    conversion_value: 0,
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    event_type: 'intake_complete',
    event_category: 'homeowner',
    session_id: 'session-123',
    lead_source: 'organic',
    conversion_value: 100,
  },
];

export const mockRetargetingAudiences = [
  {
    id: '1',
    audience_name: 'Abandoned Intake',
    audience_type: 'abandoned_intake',
    description: 'Users who started but did not complete intake',
    criteria: {
      event_types: ['intake_start'],
      exclude_event_types: ['intake_complete'],
      time_window: '7d',
    },
    estimated_size: 150,
    is_active: true,
  },
  {
    id: '2',
    audience_name: 'Viewed Pricing',
    audience_type: 'viewed_pricing',
    description: 'Users who viewed cost guides',
    criteria: {
      page_paths: ['/cost-guides/*'],
      time_window: '14d',
    },
    estimated_size: 320,
    is_active: true,
  },
];

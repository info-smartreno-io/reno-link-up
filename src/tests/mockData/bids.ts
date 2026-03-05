export const mockBidOpportunity = {
  id: 'bid-opp-123',
  title: 'Kitchen Remodel in Bergen County',
  description: 'Complete kitchen renovation',
  project_type: 'Kitchen Remodel',
  location: 'Bergen County, NJ',
  estimated_budget: 50000,
  square_footage: 300,
  bid_deadline: '2024-12-31',
  status: 'open',
  open_to_contractors: true,
  open_to_interior_designers: true,
  open_to_architects: false,
  created_by: 'homeowner-123',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

export const mockBidSubmission = {
  id: 'bid-sub-123',
  bid_opportunity_id: 'bid-opp-123',
  bidder_id: 'contractor-123',
  bidder_type: 'contractor',
  bid_amount: 45000,
  proposal_text: 'We would love to work on your kitchen remodel',
  estimated_timeline: '8 weeks',
  status: 'submitted',
  submitted_at: '2024-01-02',
  created_at: '2024-01-02',
  updated_at: '2024-01-02',
};

export const mockBidComparison = {
  id: 'comparison-123',
  bid_opportunity_id: 'bid-opp-123',
  created_by: 'admin-123',
  report_data: {
    bids: [mockBidSubmission],
    analysis: 'Comprehensive analysis of bids',
  },
  status: 'draft',
  created_at: '2024-01-03',
  updated_at: '2024-01-03',
};

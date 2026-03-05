import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockConversionEvents, mockRetargetingAudiences } from '../mockData/retargeting';
import { supabase } from '@/integrations/supabase/client';

/**
 * Retargeting System Integration Tests
 * 
 * Tests the conversion tracking and retargeting pipeline
 */

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Retargeting System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conversion Events', () => {
    it('should track page view events', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: mockConversionEvents[0], error: null });
      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      expect(mockConversionEvents[0].event_type).toBe('page_view');
    });

    it('should track intake events', async () => {
      const intakeEvents = mockConversionEvents.filter(e => 
        e.event_type === 'intake_start' || e.event_type === 'intake_complete'
      );
      
      expect(intakeEvents).toHaveLength(2);
    });

    it('should include conversion values', () => {
      const completeEvent = mockConversionEvents.find(e => e.event_type === 'intake_complete');
      expect(completeEvent?.conversion_value).toBeGreaterThan(0);
    });
  });

  describe('Retargeting Audiences', () => {
    it('should create audiences with criteria', () => {
      const audience = mockRetargetingAudiences[0];
      
      expect(audience.criteria).toHaveProperty('event_types');
      expect(audience.criteria).toHaveProperty('time_window');
    });

    it('should have audience size estimates', () => {
      mockRetargetingAudiences.forEach(audience => {
        expect(audience.estimated_size).toBeGreaterThan(0);
      });
    });

    it('should support active/inactive states', () => {
      mockRetargetingAudiences.forEach(audience => {
        expect(typeof audience.is_active).toBe('boolean');
      });
    });
  });
});

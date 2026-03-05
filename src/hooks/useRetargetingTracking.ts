/**
 * Hook for tracking retargeting events
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { retargetingPixels } from '@/utils/retargetingPixels';
import { getTrackingData } from '@/utils/leadTracking';
import { supabase } from '@/integrations/supabase/client';

export function useRetargetingTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    retargetingPixels.trackPageView(location.pathname, document.title);

    // Log to database
    logConversionEvent({
      eventType: 'page_view',
      eventCategory: 'navigation',
      pagePath: location.pathname,
      pageTitle: document.title,
    });
  }, [location]);

  const trackEvent = async (
    eventType: string,
    options?: {
      eventCategory?: string;
      value?: number;
      contentName?: string;
      contentCategory?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    // Track in pixels
    retargetingPixels.trackConversion({
      eventType,
      eventCategory: options?.eventCategory,
      value: options?.value,
      contentName: options?.contentName,
      contentCategory: options?.contentCategory,
      metadata: options?.metadata,
    });

    // Log to database
    await logConversionEvent({
      eventType,
      eventCategory: options?.eventCategory,
      conversionValue: options?.value,
      metadata: options?.metadata,
    });
  };

  const identifyUser = (userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    zipCode?: string;
  }) => {
    retargetingPixels.identifyUser(userData);
  };

  return {
    trackEvent,
    identifyUser,
  };
}

async function logConversionEvent(data: {
  eventType: string;
  eventCategory?: string;
  pagePath?: string;
  pageTitle?: string;
  conversionValue?: number;
  metadata?: Record<string, any>;
}) {
  try {
    const tracking = getTrackingData();
    const { data: userData } = await supabase.auth.getUser();

    await supabase.from('conversion_events').insert({
      event_type: data.eventType,
      event_category: data.eventCategory,
      user_id: userData.user?.id,
      session_id: tracking?.session_id,
      lead_source: tracking?.lead_source,
      utm_source: tracking?.utm_source,
      utm_medium: tracking?.utm_medium,
      utm_campaign: tracking?.utm_campaign,
      utm_content: tracking?.utm_content,
      utm_term: tracking?.utm_term,
      page_path: data.pagePath || window.location.pathname,
      page_title: data.pageTitle || document.title,
      referrer: document.referrer,
      conversion_value: data.conversionValue,
      metadata: data.metadata || {},
      fb_pixel_fired: true,
      tiktok_pixel_fired: true,
      google_ads_fired: true,
    } as any);
  } catch (error) {
    console.error('Failed to log conversion event:', error);
  }
}

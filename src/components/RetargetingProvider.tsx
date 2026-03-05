/**
 * Retargeting Provider
 * Initializes pixels and provides tracking context
 */

import { useEffect } from 'react';
import { retargetingPixels } from '@/utils/retargetingPixels';
import { useRetargetingTracking } from '@/hooks/useRetargetingTracking';

interface RetargetingProviderProps {
  children: React.ReactNode;
  config?: {
    fbPixelId?: string;
    tiktokPixelId?: string;
    googleAdsId?: string;
  };
}

export function RetargetingProvider({ children, config }: RetargetingProviderProps) {
  useRetargetingTracking();

  useEffect(() => {
    // Initialize with config from environment or props
    retargetingPixels.init({
      fbPixelId: config?.fbPixelId || import.meta.env.VITE_FB_PIXEL_ID,
      tiktokPixelId: config?.tiktokPixelId || import.meta.env.VITE_TIKTOK_PIXEL_ID,
      googleAdsId: config?.googleAdsId || import.meta.env.VITE_GOOGLE_ADS_ID,
    });
  }, [config]);

  return <>{children}</>;
}

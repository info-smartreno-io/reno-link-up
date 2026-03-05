/**
 * React hook for tracking scroll depth analytics
 */

import { useEffect, useRef } from "react";
import { trackEvent } from "@/utils/analytics";

export function useScrollTracking() {
  const tracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const percentage = Math.round((scrolled / scrollHeight) * 100);

      // Track at 25%, 50%, 75%, and 100%
      const milestones = [25, 50, 75, 100];
      
      milestones.forEach((milestone) => {
        if (percentage >= milestone && !tracked.current.has(milestone)) {
          tracked.current.add(milestone);
          trackEvent("homepage_scroll_depth", {
            depth_percentage: milestone,
            page_path: window.location.pathname,
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}

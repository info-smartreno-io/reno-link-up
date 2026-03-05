/**
 * Retargeting Pixels Management
 * Handles Facebook Pixel, TikTok Pixel, and Google Ads tracking
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, any>) => void;
      page: () => void;
      identify: (data: Record<string, any>) => void;
    };
    gtag?: (...args: any[]) => void;
  }
}

interface ConversionEvent {
  eventType: string;
  eventCategory?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentCategory?: string;
  metadata?: Record<string, any>;
}

class RetargetingPixelsManager {
  private fbPixelId: string | null = null;
  private tiktokPixelId: string | null = null;
  private googleAdsId: string | null = null;
  private initialized = false;

  /**
   * Initialize all pixels
   */
  init(config: {
    fbPixelId?: string;
    tiktokPixelId?: string;
    googleAdsId?: string;
  }) {
    if (this.initialized) return;

    this.fbPixelId = config.fbPixelId || null;
    this.tiktokPixelId = config.tiktokPixelId || null;
    this.googleAdsId = config.googleAdsId || null;

    if (this.fbPixelId) this.initFacebookPixel();
    if (this.tiktokPixelId) this.initTikTokPixel();
    if (this.googleAdsId) this.initGoogleAds();

    this.initialized = true;
  }

  /**
   * Initialize Facebook Pixel
   */
  private initFacebookPixel() {
    if (!this.fbPixelId) return;

    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq?.('init', this.fbPixelId);
    window.fbq?.('track', 'PageView');
  }

  /**
   * Initialize TikTok Pixel
   */
  private initTikTokPixel() {
    if (!this.tiktokPixelId) return;

    (function(w: any, d: any, t: any) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function(t: any, e: any) {
        t[e] = function() {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function(t: any) {
        const e = ttq._i[t] || [];
        for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      };
      ttq.load = function(e: any, n: any) {
        const i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = i;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        const o = document.createElement('script');
        o.type = 'text/javascript';
        o.async = true;
        o.src = i + '?sdkid=' + e + '&lib=' + t;
        const a = document.getElementsByTagName('script')[0];
        a.parentNode?.insertBefore(o, a);
      };
      ttq.load(this.tiktokPixelId);
      ttq.page();
    })(window, document, 'ttq');
  }

  /**
   * Initialize Google Ads
   */
  private initGoogleAds() {
    if (!this.googleAdsId) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.googleAdsId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.googleAdsId);
  }

  /**
   * Track conversion event across all pixels
   */
  trackConversion(event: ConversionEvent) {
    const { eventType, eventCategory, value, currency = 'USD', contentName, contentCategory, metadata } = event;

    // Facebook Pixel
    if (this.fbPixelId && window.fbq) {
      const fbEvent = this.mapToFacebookEvent(eventType);
      window.fbq('track', fbEvent, {
        value: value,
        currency: currency,
        content_name: contentName,
        content_category: contentCategory,
        ...metadata,
      });
    }

    // TikTok Pixel
    if (this.tiktokPixelId && window.ttq) {
      const ttEvent = this.mapToTikTokEvent(eventType);
      window.ttq.track(ttEvent, {
        value: value,
        currency: currency,
        content_name: contentName,
        content_category: contentCategory,
        ...metadata,
      });
    }

    // Google Ads
    if (this.googleAdsId && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: this.googleAdsId,
        value: value,
        currency: currency,
        event_category: eventCategory,
        event_label: contentName,
        ...metadata,
      });
    }
  }

  /**
   * Map internal event types to Facebook events
   */
  private mapToFacebookEvent(eventType: string): string {
    const mapping: Record<string, string> = {
      intake_start: 'Lead',
      intake_complete: 'CompleteRegistration',
      quote_request: 'Lead',
      contractor_signup: 'CompleteRegistration',
      page_view: 'PageView',
      add_payment_info: 'AddPaymentInfo',
      search: 'Search',
      view_content: 'ViewContent',
    };
    return mapping[eventType] || 'CustomEvent';
  }

  /**
   * Map internal event types to TikTok events
   */
  private mapToTikTokEvent(eventType: string): string {
    const mapping: Record<string, string> = {
      intake_start: 'SubmitForm',
      intake_complete: 'CompleteRegistration',
      quote_request: 'SubmitForm',
      contractor_signup: 'CompleteRegistration',
      page_view: 'PageView',
      add_payment_info: 'AddPaymentInfo',
      search: 'Search',
      view_content: 'ViewContent',
    };
    return mapping[eventType] || eventType;
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    if (this.fbPixelId && window.fbq) {
      window.fbq('track', 'PageView');
    }
    if (this.tiktokPixelId && window.ttq) {
      window.ttq.page();
    }
    if (this.googleAdsId && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      });
    }
  }

  /**
   * Identify user
   */
  identifyUser(userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    zipCode?: string;
  }) {
    if (this.fbPixelId && window.fbq && userData.email) {
      window.fbq('track', 'Lead', {
        em: userData.email,
        ph: userData.phone,
        fn: userData.firstName,
        ln: userData.lastName,
        zp: userData.zipCode,
      });
    }

    if (this.tiktokPixelId && window.ttq) {
      window.ttq.identify({
        email: userData.email,
        phone_number: userData.phone,
      });
    }
  }
}

export const retargetingPixels = new RetargetingPixelsManager();

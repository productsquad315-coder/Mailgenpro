// Google Analytics 4 tracking utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-WSS5V4X9T1';
const IS_DEV = import.meta.env.DEV;

// Helper to check if GA4 is loaded
const isGA4Loaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Initialize user identification in GA4
 * @param userId Unique identifier for the user
 * @param userProperties Optional additional user properties
 */
export const identifyUser = (userId: string | null, userProperties?: Record<string, any>) => {
  if (!isGA4Loaded() || !GA4_MEASUREMENT_ID) return;

  if (userId) {
    window.gtag?.('set', 'user_id', userId);
    if (userProperties) {
      window.gtag?.('set', 'user_properties', userProperties);
    }
    if (IS_DEV) console.log(`[GA4] User identified: ${userId}`, userProperties);
  } else {
    // Reset user_id on logout
    window.gtag?.('set', 'user_id', null);
    if (IS_DEV) console.log('[GA4] User de-identified');
  }
};

// Page view tracking
export const trackPageView = (path: string, title?: string) => {
  if (!isGA4Loaded() || !GA4_MEASUREMENT_ID) return;

  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    debug_mode: IS_DEV,
  });
};

// Generic event tracking
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!isGA4Loaded() || !GA4_MEASUREMENT_ID) return;

  const params = {
    ...eventParams,
    debug_mode: IS_DEV,
  };

  window.gtag?.('event', eventName, params);
  if (IS_DEV) console.log(`[GA4] Event: ${eventName}`, params);
};

// Button click tracking
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location || window.location.pathname,
  });
};

// Form submission tracking
export const trackFormSubmission = (formName: string, success: boolean = true) => {
  trackEvent('form_submit', {
    form_name: formName,
    success,
  });
};

// Conversion tracking
export const trackConversion = (
  conversionType: 'generation' | 'payment' | 'signup' | 'export',
  value?: number,
  metadata?: Record<string, any>
) => {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value,
    currency: 'USD',
    ...metadata,
  });
};

// Campaign generation tracking
export const trackCampaignGeneration = (
  campaignId: string,
  sequenceType?: string
) => {
  trackEvent('campaign_generated', {
    campaign_id: campaignId,
    sequence_type: sequenceType,
  });

  trackConversion('generation');
};

// Export tracking
export const trackExport = (exportType: 'html' | 'zip', campaignId: string) => {
  trackEvent('export', {
    export_type: exportType,
    campaign_id: campaignId,
  });

  trackConversion('export');
};

// Plan upgrade tracking
export const trackPlanUpgrade = (planName: string, price: number) => {
  trackEvent('upgrade_click', {
    plan_name: planName,
    price,
  });

  trackConversion('payment', price, { plan: planName });
};

// User funnel events
export const trackFunnelStep = (
  step: 'signup' | 'generate' | 'export' | 'upgrade',
  metadata?: Record<string, any>
) => {
  trackEvent('funnel_step', {
    step,
    ...metadata,
  });
};

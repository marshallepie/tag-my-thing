/**
 * Google Analytics (GA4) integration — consent-gated.
 *
 * gtag.js is NOT loaded until analytics consent is granted. Consent state is
 * persisted in localStorage so it survives reloads and applies to anonymous
 * (logged-out) visitors as well as authenticated users. The logged-in toggle in
 * Settings ("Analytics Tracking") drives the same consent flag via
 * grantAnalyticsConsent / revokeAnalyticsConsent.
 *
 * Config comes from build-time env vars (must be referenced here so Vite inlines
 * them into the bundle):
 *   VITE_GA_MEASUREMENT_ID   - one or more GA4 IDs, comma-separated
 *                              (e.g. "G-SLMCVVRSX4,G-HX6LDPGK4F"). Every ID gets
 *                              its own gtag config; events fan out to all of them.
 *   VITE_GA_LINKER_DOMAINS   - comma-separated domains for cross-domain linking
 */

const MEASUREMENT_IDS = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)
  ?.split(',')
  .map((id) => id.trim())
  .filter(Boolean) ?? [];
// First ID is treated as primary for the gtag.js loader URL.
const PRIMARY_ID = MEASUREMENT_IDS[0];
const LINKER_DOMAINS = (import.meta.env.VITE_GA_LINKER_DOMAINS as string | undefined)
  ?.split(',')
  .map((d) => d.trim())
  .filter(Boolean);

const CONSENT_KEY = 'tmt_analytics_consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let scriptLoaded = false;

/**
 * Whether analytics is allowed to run. Opt-in model: GA loads ONLY after the
 * user has explicitly granted consent (via the cookie banner or the Settings
 * toggle). No stored choice == no tracking.
 */
export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    // localStorage unavailable (e.g. SSR / privacy mode) — treat as no consent.
    return false;
  }
}

/**
 * Whether the user has made any consent decision yet (granted OR denied).
 * Used by the cookie banner to decide whether it still needs to be shown.
 */
export function hasMadeConsentChoice(): boolean {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied';
  } catch {
    return false;
  }
}

function isConfigured(): boolean {
  return MEASUREMENT_IDS.length > 0;
}

/** Inject gtag.js and run the standard GA4 bootstrap. Idempotent. */
function loadGtag(): void {
  if (scriptLoaded || !isConfigured()) return;
  scriptLoaded = true;

  window.dataLayer = window.dataLayer || [];
  // gtag must push `arguments` verbatim — do not spread into an array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${PRIMARY_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());

  const config: Record<string, unknown> = {
    // We send page_view manually on SPA route changes.
    send_page_view: false,
  };
  if (LINKER_DOMAINS && LINKER_DOMAINS.length > 0) {
    config.linker = {
      domains: LINKER_DOMAINS,
      accept_incoming: true,
    };
  }
  // Configure every measurement ID. gtag('event', ...) without an explicit
  // send_to fans out to all configured streams.
  for (const id of MEASUREMENT_IDS) {
    window.gtag('config', id, config);
  }
}

/**
 * Initialize analytics on app boot. Loads GA only when configured AND consent is
 * present. Safe to call when env vars are missing (no-op).
 */
export function initAnalytics(): void {
  if (!isConfigured()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[analytics] VITE_GA_MEASUREMENT_ID not set — GA disabled.');
    }
    return;
  }
  if (hasAnalyticsConsent()) {
    loadGtag();
  }
}

/** Record a SPA page view. No-op until GA has been loaded. */
export function trackPageView(path: string): void {
  if (!window.gtag || !isConfigured()) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Record a custom event. No-op until GA has been loaded. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!window.gtag) return;
  window.gtag('event', name, params || {});
}

/** Grant consent: persist and load GA immediately if not already loaded. */
export function grantAnalyticsConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, 'granted');
  } catch {
    /* ignore */
  }
  loadGtag();
}

/**
 * Revoke consent: persist and disable further data collection. gtag.js cannot be
 * unloaded once injected, so we set the GA disable flag and clear tracking; a
 * full reload guarantees the script is no longer present.
 */
export function revokeAnalyticsConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, 'denied');
  } catch {
    /* ignore */
  }
  // Standard GA opt-out flag honored by gtag.js — set for every configured ID.
  for (const id of MEASUREMENT_IDS) {
    (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = true;
  }
}

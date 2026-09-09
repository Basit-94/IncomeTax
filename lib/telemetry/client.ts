/**
 * lib/telemetry/client.ts
 *
 * Sovereign, non-blocking telemetry recorder for tracking user & judge activity,
 * manual filing steps, AI conversations, document operations, and UX metrics.
 *
 * Uses navigator.sendBeacon when available or background fetch so it introduces 0 latency.
 *
 * Viewer buckets (2026-09-09): nothing on the page ever says who is watching. The team marks
 * its own browsers once by opening any page with `?tester=<name>` (the param is stored and
 * stripped from the URL in the same tick); agents the team sends get `?tester=agent-<name>`.
 * A scripted browser (webdriver / headless UA) is bucketed as an agent even without a mark.
 * Everything unmarked is a presumed judge — the inspector shows that bucket by default.
 */

export type UserActivityType =
  | 'sign_in'
  | 'sign_out'
  | 'page_view'
  | 'switch_lang'
  | 'switch_theme'
  | 'switch_mode'
  | 'upload_doc'
  | 'tab_switch'
  | 'step_advance'
  | 'compute_tax'
  | 'regime_select'
  | 'dispute_create'
  | 'bank_fix'
  | 'challan_pay'
  | 'itrv_download'
  | 'itrv_print'
  | 'agent_prompt'
  | 'agent_reply'
  | 'mic_dictation'
  | 'vault_open'
  | 'vault_doc_view'
  | 'ca_share_open'
  | 'ca_request_send'
  | 'ca_review_view'
  | 'ca_adopt_version'
  | 'ca_register'
  | 'ca_login'
  | 'error_encounter';

export type UserKind = 'citizen' | 'ca' | 'demo' | 'judge' | 'tester' | 'agent';

export interface ActivityPayload {
  eventType: UserActivityType;
  pan?: string;
  userName?: string;
  userKind?: UserKind;
  sessionId?: string;
  details?: Record<string, unknown>;
  lang?: string;
}

/** What the server needs to bucket an event; also sent with /api/agent so chat rows land in the same bucket. */
export interface TelemetryMeta {
  sessionId: string;
  userKind: UserKind;
  tester: string | null;
  origin: string;
  automation: boolean;
}

const MARK_KEY = 'wapsi_tester_mark';
const MARK_PARAM = 'tester';

let cachedSessionId: string | null = null;
let markCaptured = false;
let lastPageView = { path: '', at: 0 };

export function getClientSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('wapsi_audit_session_id');
      if (stored) {
        cachedSessionId = stored;
        return stored;
      }
      const fresh = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('wapsi_audit_session_id', fresh);
      cachedSessionId = fresh;
      return fresh;
    } catch {
      // fallback
    }
  }
  return 's_anon_' + Date.now();
}

/**
 * Reads `?tester=<name>` once per page load, stores it, and removes it from the address bar so
 * the page looks identical afterwards. `?tester=off` clears the mark.
 */
function captureTesterMark(): void {
  if (markCaptured || typeof window === 'undefined') return;
  markCaptured = true;
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get(MARK_PARAM);
    if (raw === null) return;
    const value = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
    if (!value || value === 'off') localStorage.removeItem(MARK_KEY);
    else localStorage.setItem(MARK_KEY, value);
    url.searchParams.delete(MARK_PARAM);
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  } catch {
    // ignore
  }
}

function getTesterMark(): string | null {
  if (typeof window === 'undefined') return null;
  captureTesterMark();
  try {
    return localStorage.getItem(MARK_KEY);
  } catch {
    return null;
  }
}

function isAutomatedBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (navigator.webdriver === true) return true;
  return /HeadlessChrome|Headless|Playwright|Puppeteer|Selenium|PhantomJS|bot\b|crawler|spider/i.test(navigator.userAgent);
}

/** The bucket this browser belongs to, given the kind the caller would otherwise record. */
export function getTelemetryMeta(baseKind: UserKind = 'citizen'): TelemetryMeta {
  const tester = getTesterMark();
  const automation = isAutomatedBrowser();
  let userKind: UserKind = baseKind;
  if (tester) userKind = tester.startsWith('agent') ? 'agent' : 'tester';
  else if (automation) userKind = 'agent';
  return {
    sessionId: getClientSessionId(),
    userKind,
    tester,
    origin: typeof window !== 'undefined' ? window.location.hostname : '',
    automation,
  };
}

/** Mounted once per page (components/telemetry/telemetry-boot.tsx): captures the mark, records the visit. */
export function initTelemetry(): void {
  if (typeof window === 'undefined') return;
  captureTesterMark();
  // React runs mount effects twice in development; one row per path per second is enough.
  const key = window.location.pathname;
  const now = Date.now();
  if (lastPageView.path === key && now - lastPageView.at < 1000) return;
  lastPageView = { path: key, at: now };
  recordActivity('page_view', { path: key, referrer: document.referrer || undefined });
}

/**
 * Non-blocking activity recording.
 */
export function recordActivity(
  eventType: UserActivityType,
  details: Record<string, unknown> = {},
  userOverride?: { pan?: string; userName?: string; userKind?: UserKind; lang?: string },
): void {
  if (typeof window === 'undefined') return;

  try {
    const storedLang = userOverride?.lang || localStorage.getItem('wapsi_lang') || 'en';

    // Resolve user info from localStorage if not provided
    let pan = userOverride?.pan;
    let userName = userOverride?.userName;
    let baseKind: UserKind = userOverride?.userKind || 'citizen';

    if (!pan) {
      try {
        const sessionRaw = localStorage.getItem('wapsi_session');
        if (sessionRaw) {
          const parsed = JSON.parse(sessionRaw);
          pan = parsed.pan;
          userName = parsed.name || parsed.displayName;
          if (parsed.isDemo) baseKind = 'demo';
        }
      } catch {
        // ignore
      }
    }

    const meta = getTelemetryMeta(baseKind);
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    const userAgent = navigator.userAgent;

    const body = JSON.stringify({
      id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      sessionId: meta.sessionId,
      pan: pan || 'ANONYMOUS',
      userName: userName || 'Visitor',
      userKind: meta.userKind,
      tester: meta.tester,
      origin: meta.origin,
      automation: meta.automation,
      eventType,
      details,
      userAgent,
      screenSize,
      lang: storedLang,
      createdAt: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry/event', blob);
    } else {
      void fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking, never interrupt UI
  }
}

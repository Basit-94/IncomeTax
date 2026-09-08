/**
 * lib/telemetry/client.ts
 *
 * Sovereign, non-blocking telemetry recorder for tracking user & judge activity,
 * manual filing steps, AI conversations, document operations, and UX metrics.
 *
 * Uses navigator.sendBeacon when available or background fetch so it introduces 0 latency.
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

export interface ActivityPayload {
  eventType: UserActivityType;
  pan?: string;
  userName?: string;
  userKind?: 'citizen' | 'ca' | 'demo' | 'judge';
  sessionId?: string;
  details?: Record<string, unknown>;
  lang?: string;
}

let cachedSessionId: string | null = null;

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
 * Non-blocking activity recording.
 */
export function recordActivity(
  eventType: UserActivityType,
  details: Record<string, unknown> = {},
  userOverride?: { pan?: string; userName?: string; userKind?: 'citizen' | 'ca' | 'demo' | 'judge'; lang?: string },
): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getClientSessionId();
    const storedLang = userOverride?.lang || localStorage.getItem('wapsi_lang') || 'en';
    
    // Resolve user info from localStorage if not provided
    let pan = userOverride?.pan;
    let userName = userOverride?.userName;
    let userKind = userOverride?.userKind || 'citizen';

    if (!pan) {
      try {
        const sessionRaw = localStorage.getItem('wapsi_session');
        if (sessionRaw) {
          const parsed = JSON.parse(sessionRaw);
          pan = parsed.pan;
          userName = parsed.name || parsed.displayName;
          if (parsed.isDemo) userKind = 'demo';
        }
      } catch {
        // ignore
      }
    }

    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    const userAgent = navigator.userAgent;

    const body = JSON.stringify({
      id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      sessionId,
      pan: pan || 'ANONYMOUS',
      userName: userName || 'Visitor',
      userKind,
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

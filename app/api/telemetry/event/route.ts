import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getDbPool, initDb } from '@/lib/db/postgres';
import { bucketOf } from '@/lib/telemetry/bucket';
import { notifyJudgeOnce } from '@/lib/telemetry/judgeAlert';

interface TelemetryEventBody {
  id?: string;
  sessionId?: string;
  pan?: string;
  userName?: string;
  userKind?: string;
  tester?: string | null;
  origin?: string;
  automation?: boolean;
  eventType: string;
  details?: Record<string, unknown>;
  userAgent?: string;
  screenSize?: string;
  lang?: string;
  createdAt?: string;
}

const KINDS = new Set(['citizen', 'ca', 'demo', 'judge', 'tester', 'agent']);
const SIGN_IN_EVENTS = new Set(['sign_in', 'ca_login']);

function hashIp(req: NextRequest): string | null {
  const raw = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  if (!raw) return null;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    let body: TelemetryEventBody;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }

    if (!body || !body.eventType) {
      return NextResponse.json({ ok: false, error: 'Missing eventType' }, { status: 400 });
    }

    const id = body.id || 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const sessionId = (body.sessionId || 's_anon').slice(0, 64);
    const pan = (body.pan || 'ANONYMOUS').toUpperCase().slice(0, 16);
    const userName = (body.userName || 'Visitor').slice(0, 120);
    const eventType = body.eventType.slice(0, 64);
    const details = body.details ? JSON.stringify(body.details) : '{}';
    const userAgent = (body.userAgent || req.headers.get('user-agent') || '').slice(0, 255);
    const screenSize = (body.screenSize || '').slice(0, 32);
    const lang = (body.lang || 'en').slice(0, 8);
    const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();
    const tester = body.tester ? String(body.tester).toLowerCase().slice(0, 64) : null;
    const origin = (body.origin || req.headers.get('host')?.split(':')[0] || '').toLowerCase().slice(0, 64);
    const automation = body.automation === true || /HeadlessChrome|Playwright|Puppeteer/i.test(userAgent);
    // The client already resolved the kind; re-derive the bucket-critical part so a stale client cannot
    // land a marked browser in the judge bucket.
    let userKind = KINDS.has(body.userKind || '') ? (body.userKind as string) : 'citizen';
    if (tester) userKind = tester.startsWith('agent') ? 'agent' : 'tester';
    else if (automation) userKind = 'agent';
    const ipHash = hashIp(req);

    const pool = getDbPool();
    if (pool) {
      await initDb();
      // Fire-and-forget query into Supabase
      pool.query(
        `INSERT INTO user_activity_events
           (id, session_id, pan, user_name, user_kind, event_type, details, user_agent, screen_size, lang, created_at,
            origin, tester, automation, ip_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
        [id, sessionId, pan, userName, userKind, eventType, details, userAgent, screenSize, lang, createdAt,
          origin || null, tester, automation, ipHash]
      ).catch(() => {
        // Safe failover
      });

      if (bucketOf({ userKind, origin, automation }) === 'judge' && sessionId !== 's_anon') {
        const base = { sessionId, pan, userName, origin, lang, screenSize, userAgent, eventType };
        // Awaited: on serverless the push must finish before the response is sent.
        await notifyJudgeOnce(pool, { ...base, kind: 'arrival' }).catch(() => false);
        if (SIGN_IN_EVENTS.has(eventType)) {
          await notifyJudgeOnce(pool, { ...base, kind: 'sign_in' }).catch(() => false);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

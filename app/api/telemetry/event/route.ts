import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db/postgres';

interface TelemetryEventBody {
  id?: string;
  sessionId?: string;
  pan?: string;
  userName?: string;
  userKind?: string;
  eventType: string;
  details?: Record<string, unknown>;
  userAgent?: string;
  screenSize?: string;
  lang?: string;
  createdAt?: string;
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
    const sessionId = body.sessionId || 's_anon';
    const pan = (body.pan || 'ANONYMOUS').toUpperCase().slice(0, 16);
    const userName = (body.userName || 'Visitor').slice(0, 120);
    const userKind = (body.userKind || 'citizen').slice(0, 16);
    const eventType = body.eventType.slice(0, 64);
    const details = body.details ? JSON.stringify(body.details) : '{}';
    const userAgent = (body.userAgent || req.headers.get('user-agent') || '').slice(0, 255);
    const screenSize = (body.screenSize || '').slice(0, 32);
    const lang = (body.lang || 'en').slice(0, 8);
    const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

    const pool = getPool();
    if (pool) {
      // Fire-and-forget query into Supabase
      pool.query(
        INSERT INTO user_activity_events (id, session_id, pan, user_name, user_kind, event_type, details, user_agent, screen_size, lang, created_at)
         VALUES (, , , , , , , , , , )
         ON CONFLICT (id) DO NOTHING,
        [id, sessionId, pan, userName, userKind, eventType, details, userAgent, screenSize, lang, createdAt]
      ).catch(() => {
        // Safe failover
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

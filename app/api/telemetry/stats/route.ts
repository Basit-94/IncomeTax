import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/postgres';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  if (!isLocal) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today';
    const queryUser = searchParams.get('user') || '';

    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    const now = new Date();
    if (range === 'today') {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      fromDate = today;
    } else if (range === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      yest.setHours(0, 0, 0, 0);
      const yestEnd = new Date(yest);
      yestEnd.setHours(23, 59, 59, 999);
      fromDate = yest;
      toDate = yestEnd;
    } else if (range === '7d') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      d7.setHours(0, 0, 0, 0);
      fromDate = d7;
    } else if (range === 'all') {
      fromDate = null;
      toDate = null;
    }

    const client = await pool.connect();
    try {
      let activitySql = 'SELECT * FROM user_activity_events WHERE 1=1';
      const activityParams: unknown[] = [];
      if (fromDate) {
        activityParams.push(fromDate.toISOString());
        activitySql += ` AND created_at >= $${activityParams.length}`;
      }
      if (toDate) {
        activityParams.push(toDate.toISOString());
        activitySql += ` AND created_at <= $${activityParams.length}`;
      }
      if (queryUser) {
        activityParams.push(`%${queryUser.toUpperCase()}%`);
        activitySql += ` AND (UPPER(pan) LIKE $${activityParams.length} OR UPPER(user_name) LIKE $${activityParams.length})`;
      }
      activitySql += ' ORDER BY created_at DESC LIMIT 500';

      let runsSql = 'SELECT * FROM agent_runs WHERE 1=1';
      const runParams: unknown[] = [];
      if (fromDate) {
        runParams.push(fromDate.toISOString());
        runsSql += ` AND created_at >= $${runParams.length}`;
      }
      if (toDate) {
        runParams.push(toDate.toISOString());
        runsSql += ` AND created_at <= $${runParams.length}`;
      }
      if (queryUser) {
        runParams.push(`%${queryUser.toUpperCase()}%`);
        runsSql += ` AND UPPER(owner_pan) LIKE $${runParams.length}`;
      }
      runsSql += ' ORDER BY created_at DESC LIMIT 200';

      const [actRes, runsRes, vaultRes, snapsRes, caRevRes, caAccRes] = await Promise.all([
        client.query(activitySql, activityParams).catch(() => ({ rows: [] })),
        client.query(runsSql, runParams).catch(() => ({ rows: [] })),
        client.query('SELECT * FROM vault_documents ORDER BY updated_at DESC LIMIT 100').catch(() => ({ rows: [] })),
        client.query('SELECT * FROM tax_return_snapshots ORDER BY created_at DESC LIMIT 100').catch(() => ({ rows: [] })),
        client.query('SELECT * FROM ca_review_requests ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] })),
        client.query('SELECT * FROM ca_accounts ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] })),
      ]);

      const runIds = runsRes.rows.map((r: { id: string }) => r.id);
      let runEvents: unknown[] = [];
      if (runIds.length > 0) {
        const evRes = await client.query(
          'SELECT * FROM agent_events WHERE run_id = ANY($1) ORDER BY created_at ASC',
          [runIds]
        ).catch(() => ({ rows: [] }));
        runEvents = evRes.rows;
      }

      return NextResponse.json({
        ok: true,
        data: {
          activities: actRes.rows,
          runs: runsRes.rows,
          runEvents,
          vaultDocuments: vaultRes.rows,
          snapshots: snapsRes.rows,
          caReviews: caRevRes.rows,
          caAccounts: caAccRes.rows,
        },
        serverTime: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

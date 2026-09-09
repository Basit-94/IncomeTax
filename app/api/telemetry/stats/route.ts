import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, initDb } from '@/lib/db/postgres';
import { bucketSql } from '@/lib/telemetry/bucket';
import { judgeAlertsConfigured } from '@/lib/telemetry/judgeAlert';

const BUCKETS = new Set(['judge', 'tester', 'agent', 'all']);

export async function GET(req: NextRequest) {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today';
    const queryUser = searchParams.get('user') || '';
    const bucketParam = searchParams.get('bucket') || 'judge';
    const bucket = BUCKETS.has(bucketParam) ? bucketParam : 'judge';

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

    await initDb();
    const client = await pool.connect();
    try {
      const rangeParams: unknown[] = [];
      let rangeSql = '';
      if (fromDate) {
        rangeParams.push(fromDate.toISOString());
        rangeSql += ` AND created_at >= $${rangeParams.length}`;
      }
      if (toDate) {
        rangeParams.push(toDate.toISOString());
        rangeSql += ` AND created_at <= $${rangeParams.length}`;
      }

      // Every row carries its bucket; the filter is applied on that derived column so the
      // rule lives in one place (lib/telemetry/bucket.ts).
      let activitySql = `SELECT * FROM (SELECT *, ${bucketSql()} AS bucket FROM user_activity_events WHERE 1=1${rangeSql}) e WHERE 1=1`;
      const activityParams: unknown[] = [...rangeParams];
      if (bucket !== 'all') {
        activityParams.push(bucket);
        activitySql += ` AND bucket = $${activityParams.length}`;
      }
      if (queryUser) {
        activityParams.push(`%${queryUser.toUpperCase()}%`);
        activitySql += ` AND (UPPER(pan) LIKE $${activityParams.length} OR UPPER(user_name) LIKE $${activityParams.length} OR UPPER(COALESCE(tester, '')) LIKE $${activityParams.length})`;
      }
      activitySql += ' ORDER BY created_at DESC LIMIT 500';

      const countsSql = `SELECT bucket, COUNT(DISTINCT session_id)::int AS sessions
        FROM (SELECT session_id, ${bucketSql()} AS bucket FROM user_activity_events WHERE 1=1${rangeSql}) b
        GROUP BY bucket`;

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

      const [actRes, countsRes, runsRes, vaultRes, snapsRes, caRevRes, caAccRes, alertsRes] = await Promise.all([
        client.query(activitySql, activityParams).catch(() => ({ rows: [] })),
        client.query(countsSql, rangeParams).catch(() => ({ rows: [] })),
        client.query(runsSql, runParams).catch(() => ({ rows: [] })),
        client.query('SELECT * FROM vault_documents ORDER BY updated_at DESC LIMIT 100').catch(() => ({ rows: [] })),
        client.query('SELECT * FROM tax_return_snapshots ORDER BY created_at DESC LIMIT 100').catch(() => ({ rows: [] })),
        client.query('SELECT * FROM ca_review_requests ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] })),
        client.query('SELECT * FROM ca_accounts ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] })),
        client.query('SELECT session_id, kind, pan, user_name, origin, sent_at FROM judge_alerts ORDER BY sent_at DESC LIMIT 50').catch(() => ({ rows: [] })),
      ]);

      const runIds = runsRes.rows.map((r: { id: string }) => r.id);
      let runEvents: unknown[] = [];
      if (runIds.length > 0) {
        const evRes = await client.query(
          'SELECT run_id, seq, at AS created_at, type, payload FROM agent_run_events WHERE run_id = ANY($1) ORDER BY seq ASC',
          [runIds]
        ).catch(() => ({ rows: [] }));
        runEvents = evRes.rows;
      }

      const bucketCounts: Record<string, number> = { judge: 0, tester: 0, agent: 0 };
      for (const row of countsRes.rows as Array<{ bucket: string; sessions: number }>) {
        bucketCounts[row.bucket] = row.sessions;
      }

      return NextResponse.json({
        ok: true,
        data: {
          activities: actRes.rows,
          bucketCounts,
          runs: runsRes.rows,
          runEvents,
          vaultDocuments: vaultRes.rows,
          snapshots: snapsRes.rows,
          caReviews: caRevRes.rows,
          caAccounts: caAccRes.rows,
          alerts: alertsRes.rows,
          alertsConfigured: judgeAlertsConfigured(),
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

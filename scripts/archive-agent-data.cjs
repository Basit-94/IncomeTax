const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function archive() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.fgavggicudgjbwnrgaqb:ffyF90XUbxiwhIeG@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Fetching all historical agent runs, events, and vault documents...');
  try {
    const runsRes = await pool.query('SELECT * FROM agent_runs ORDER BY created_at ASC');
    const eventsRes = await pool.query('SELECT * FROM agent_run_events ORDER BY run_id, seq ASC');
    const vaultRes = await pool.query('SELECT id, owner_pan, doc_type, title, issuer, uploaded_at FROM vault_documents');
    const snapshotsRes = await pool.query('SELECT owner_pan, owner_kind, assessment_year, revision, updated_at FROM return_snapshots');
    const usersRes = await pool.query('SELECT pan, full_name, mobile, status FROM tax_vault_users');

    const archiveData = {
      archivedAt: new Date().toISOString(),
      stats: {
        totalRuns: runsRes.rows.length,
        totalEvents: eventsRes.rows.length,
        totalVaultDocs: vaultRes.rows.length,
        totalSnapshots: snapshotsRes.rows.length,
        totalUsers: usersRes.rows.length
      },
      users: usersRes.rows,
      snapshots: snapshotsRes.rows,
      vaultDocuments: vaultRes.rows,
      runs: runsRes.rows.map(r => ({
        ...r,
        events: eventsRes.rows.filter(e => e.run_id === r.id)
      }))
    };

    const outDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'agent_telemetry_archive.json');
    fs.writeFileSync(outFile, JSON.stringify(archiveData, null, 2));

    console.log(`Successfully archived ${runsRes.rows.length} runs and ${eventsRes.rows.length} events to ${outFile}`);
  } catch (err) {
    console.error('Archival failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

archive();

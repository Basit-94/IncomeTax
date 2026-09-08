const { Pool } = require('pg');

async function purge() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.fgavggicudgjbwnrgaqb:ffyF90XUbxiwhIeG@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Purging active tables in PostgreSQL...');
  try {
    // Truncate all runtime and agent tables to ensure clean slate for judges
    await pool.query(`
      TRUNCATE TABLE 
        agent_run_events,
        agent_outputs,
        agent_memory,
        agent_budget_usage,
        agent_runs,
        vault_document_bytes,
        vault_extractions,
        vault_access_audit,
        vault_documents,
        return_command_log,
        return_snapshots,
        wapsi_sessions,
        tax_vault_users,
        digilocker_records
      CASCADE;
    `);

    console.log('Successfully purged all active sessions, chats, vault docs, and return snapshots.');
  } catch (err) {
    console.error('Purge failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

purge();

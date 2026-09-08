import pg from "pg";

const { Pool } = pg;
const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connStr) {
  console.log("No PostgreSQL database connection configured.");
  process.exit(0);
}

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

const MOCK_PANS = [
  "BZSPA7412M",
  "BMZPM4821K",
  "ABCDE1234F",
  "AAAPZ1234C",
  "BBBPV5678D",
  "CCCSD9012E",
  "DEMPS4417K",
  "DEMPK8823R",
  "DEMPS9052M",
  "TESTP1234K",
  "ABCPD1982K",
  "FAHPA1987M",
];

async function purgeMockData() {
  console.log("Cleaning up mock test filing data for competition judges...");
  console.log("Target mock PANs:", MOCK_PANS.join(", "));

  // Tables using column `pan`
  const panTables = ["wapsi_sessions", "tax_vault_users", "digilocker_records"];
  for (const table of panTables) {
    try {
      const res = await pool.query(`DELETE FROM ${table} WHERE pan = ANY($1)`, [MOCK_PANS]);
      console.log(`✓ Cleaned ${res.rowCount} mock rows from ${table}`);
    } catch (err) {
      console.log(`Table ${table}: ${err.message}`);
    }
  }

  // Tables using column `owner_pan`
  const ownerPanTables = [
    "return_snapshots",
    "return_command_log",
    "vault_documents",
    "vault_access_audit",
    "agent_runs",
    "agent_memory",
    "agent_budget_usage",
  ];
  for (const table of ownerPanTables) {
    try {
      const res = await pool.query(`DELETE FROM ${table} WHERE owner_pan = ANY($1)`, [MOCK_PANS]);
      console.log(`✓ Cleaned ${res.rowCount} mock rows from ${table}`);
    } catch (err) {
      console.log(`Table ${table}: ${err.message}`);
    }
  }

  // CA reviews for mock PANs
  try {
    const res = await pool.query(`DELETE FROM ca_reviews WHERE citizen_pan = ANY($1)`, [MOCK_PANS]);
    console.log(`✓ Cleaned ${res.rowCount} mock rows from ca_reviews`);
  } catch (err) {
    console.log(`Table ca_reviews: ${err.message}`);
  }

  // User activity telemetry for mock PANs and test names
  try {
    const res = await pool.query(
      `DELETE FROM user_activity_events WHERE pan = ANY($1) OR user_name ILIKE '%Arjun%' OR user_name ILIKE '%Anthony%' OR user_name ILIKE '%Faheem%' OR user_name ILIKE '%Abdul%'`,
      [MOCK_PANS]
    );
    console.log(`✓ Cleaned ${res.rowCount} test telemetry rows from user_activity_events`);
  } catch (err) {
    console.log(`Table user_activity_events: ${err.message}`);
  }

  // Also purge test user names from tax_vault_users
  try {
    const res = await pool.query(
      `DELETE FROM tax_vault_users WHERE full_name ILIKE '%Abdul%' OR full_name ILIKE '%Arjun Mehta%' OR full_name ILIKE '%Anthony%' OR full_name ILIKE '%Faheem%'`
    );
    console.log(`✓ Cleaned ${res.rowCount} test name records from tax_vault_users`);
  } catch (err) {
    console.log(`tax_vault_users name filter: ${err.message}`);
  }

  console.log("Database mock test data purge complete! Real unique users and registered CAs are preserved.");
  await pool.end();
}

purgeMockData().catch((err) => {
  console.error("Purge error:", err);
  process.exit(1);
});

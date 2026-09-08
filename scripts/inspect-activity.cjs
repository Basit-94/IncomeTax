const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ANSI colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  yellow: '\x1b[33m',
  brightYellow: '\x1b[93m',
  blue: '\x1b[34m',
  brightBlue: '\x1b[94m',
  magenta: '\x1b[35m',
  brightMagenta: '\x1b[95m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  red: '\x1b[31m',
  brightRed: '\x1b[91m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgMagenta: '\x1b[45m',
};

// Parse CLI flags
const args = process.argv.slice(2);
let live = false;
let exportReport = false;
let jsonOutput = false;
let targetUser = null;
let fromDate = null;
let toDate = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--live' || arg === '-l') live = true;
  else if (arg === '--export' || arg === '-e') exportReport = true;
  else if (arg === '--json') jsonOutput = true;
  else if (arg === '--today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fromDate = today;
  } else if (arg === '--yesterday') {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    yest.setHours(0, 0, 0, 0);
    const yestEnd = new Date(yest);
    yestEnd.setHours(23, 59, 59, 999);
    fromDate = yest;
    toDate = yestEnd;
  } else if (arg === '--all') {
    fromDate = null;
    toDate = null;
  } else if (arg === '--from' && args[i + 1]) {
    fromDate = new Date(args[++i]);
  } else if (arg === '--to' && args[i + 1]) {
    toDate = new Date(args[++i]);
    toDate.setHours(23, 59, 59, 999);
  } else if ((arg === '--user' || arg === '-u') && args[i + 1]) {
    targetUser = args[++i].toUpperCase();
  }
}

// Default to today if no date filter specified
if (!fromDate && !toDate && !args.includes('--all')) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fromDate = today;
}

function getDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const text = fs.readFileSync(envLocalPath, 'utf8');
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DATABASE_URL=')) {
          return trimmed.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch {}
  return 'postgresql://postgres.fgavggicudgjbwnrgaqb:ffyF90XUbxiwhIeG@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
}

const pool = new Pool({
  connectionString: getDbUrl(),
  ssl: { rejectUnauthorized: false },
});

async function fetchActivityData() {
  const client = await pool.connect();
  try {
    let activitySql = 'SELECT * FROM user_activity_events WHERE 1=1';
    const params = [];
    if (fromDate) {
      params.push(fromDate.toISOString());
      activitySql += ' AND created_at >= $' + params.length;
    }
    if (toDate) {
      params.push(toDate.toISOString());
      activitySql += ' AND created_at <= $' + params.length;
    }
    if (targetUser) {
      params.push('%' + targetUser + '%');
      activitySql += ' AND (pan ILIKE $' + params.length + ' OR user_name ILIKE $' + params.length + ')';
    }
    activitySql += ' ORDER BY created_at ASC';
    const activityRes = await client.query(activitySql, params).catch(() => ({ rows: [] }));

    let runsSql = 'SELECT * FROM agent_runs WHERE 1=1';
    const runParams = [];
    if (fromDate) {
      runParams.push(fromDate.toISOString());
      runsSql += ' AND created_at >= $' + runParams.length;
    }
    if (toDate) {
      runParams.push(toDate.toISOString());
      runsSql += ' AND created_at <= $' + runParams.length;
    }
    if (targetUser) {
      runParams.push('%' + targetUser + '%');
      runsSql += ' AND owner_pan ILIKE $' + runParams.length;
    }
    runsSql += ' ORDER BY created_at ASC';
    const runsRes = await client.query(runsSql, runParams).catch(() => ({ rows: [] }));

    let eventsRes = { rows: [] };
    if (runsRes.rows.length > 0) {
      const runIds = runsRes.rows.map((r) => r.id);
      eventsRes = await client.query(
        'SELECT * FROM agent_run_events WHERE run_id = ANY($1::text[]) ORDER BY run_id, seq ASC',
        [runIds]
      ).catch(() => ({ rows: [] }));
    }

    const snapshotsRes = await client.query(
      'SELECT * FROM return_snapshots ORDER BY updated_at DESC'
    ).catch(() => ({ rows: [] }));

    const vaultRes = await client.query(
      'SELECT * FROM vault_documents ORDER BY uploaded_at DESC'
    ).catch(() => ({ rows: [] }));

    const caReviewsRes = await client.query(
      'SELECT * FROM ca_reviews ORDER BY updated_at DESC'
    ).catch(() => ({ rows: [] }));

    const caAccountsRes = await client.query(
      'SELECT id, name, membership_no, firm_name, city, email, registered_at, review_count FROM ca_accounts'
    ).catch(() => ({ rows: [] }));

    return {
      activities: activityRes.rows,
      runs: runsRes.rows,
      runEvents: eventsRes.rows,
      snapshots: snapshotsRes.rows,
      vaultDocuments: vaultRes.rows,
      caReviews: caReviewsRes.rows,
      caAccounts: caAccountsRes.rows,
    };
  } finally {
    client.release();
  }
}

function formatTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderTerminalDashboard(data) {
  console.clear();
  console.log(C.brightCyan + C.bold + '══════════════════════════════════════════════════════════════════════════════════════' + C.reset);
  console.log(C.brightCyan + C.bold + '           WAPSI TAX PLATFORM — LIVE JUDGE & CITIZEN ACTIVITY INSPECTOR         ' + C.reset);
  console.log(C.brightCyan + C.bold + '══════════════════════════════════════════════════════════════════════════════════════' + C.reset);

  const filterText = fromDate
    ? 'From: ' + C.brightYellow + formatDate(fromDate) + ' ' + formatTime(fromDate) + C.reset + ' ' + (toDate ? 'To: ' + C.brightYellow + formatDate(toDate) + ' ' + formatTime(toDate) + C.reset : '(Live/Active)')
    : 'All Time';
  console.log(' Filter: ' + filterText + ' | Events: ' + C.brightGreen + (data.activities.length + data.runs.length) + C.reset + ' | DB: ' + C.green + 'Supabase Cloud (Connected)' + C.reset + '\n');

  const sessions = new Map();

  for (const act of data.activities) {
    const sid = act.session_id || act.pan || 's_anon';
    if (!sessions.has(sid)) {
      sessions.set(sid, {
        id: sid,
        pan: act.pan || 'ANONYMOUS',
        userName: act.user_name || 'Visitor',
        userKind: act.user_kind || 'citizen',
        userAgent: act.user_agent || '',
        screenSize: act.screen_size || '',
        lang: act.lang || 'en',
        firstSeen: act.created_at,
        lastSeen: act.created_at,
        events: [],
        chats: [],
      });
    }
    const sess = sessions.get(sid);
    if (new Date(act.created_at) > new Date(sess.lastSeen)) sess.lastSeen = act.created_at;
    if (act.pan && act.pan !== 'ANONYMOUS') sess.pan = act.pan;
    if (act.user_name && act.user_name !== 'Visitor') sess.userName = act.user_name;
    if (act.user_kind) sess.userKind = act.user_kind;
    sess.events.push(act);
  }

  for (const run of data.runs) {
    const sid = run.owner_pan || 's_agent';
    if (!sessions.has(sid)) {
      sessions.set(sid, {
        id: sid,
        pan: run.owner_pan || 'ANON',
        userName: run.owner_kind === 'demo' ? 'Demo (' + run.owner_pan + ')' : run.owner_pan,
        userKind: run.owner_kind,
        userAgent: '',
        screenSize: '',
        lang: run.lang || 'en',
        firstSeen: run.created_at,
        lastSeen: run.updated_at || run.created_at,
        events: [],
        chats: [],
      });
    }
    const sess = sessions.get(sid);
    const rEvents = data.runEvents.filter((e) => e.run_id === run.id);
    sess.chats.push({ run, events: rEvents });
  }

  const totalSessions = sessions.size;
  const totalChats = data.runs.length;
  const totalDocs = data.vaultDocuments.length;
  const totalSnapshots = data.snapshots.length;
  const totalCAReviews = data.caReviews.length;

  console.log(C.bold + C.brightBlue + '┌─ 📊 EXECUTIVE METRICS ─────────────────────────────────────────────────────────────┐' + C.reset);
  console.log((C.brightBlue + '│' + C.reset + '  👥 Unique Judges / Visitors:  ' + C.bold + C.brightGreen + totalSessions + C.reset).padEnd(65) + C.brightBlue + '│' + C.reset);
  console.log((C.brightBlue + '│' + C.reset + '  💬 AI Conversations / Turns: ' + C.bold + C.brightYellow + totalChats + C.reset).padEnd(65) + C.brightBlue + '│' + C.reset);
  console.log((C.brightBlue + '│' + C.reset + '  📄 Vault Documents Uploaded: ' + C.bold + C.brightCyan + totalDocs + C.reset).padEnd(65) + C.brightBlue + '│' + C.reset);
  console.log((C.brightBlue + '│' + C.reset + '  📑 Returns Prepared/Filed:   ' + C.bold + C.brightMagenta + totalSnapshots + C.reset).padEnd(65) + C.brightBlue + '│' + C.reset);
  console.log((C.brightBlue + '│' + C.reset + '  🧑‍⚖️ CA Reviews / Portals:     ' + C.bold + C.brightGreen + totalCAReviews + C.reset).padEnd(65) + C.brightBlue + '│' + C.reset);
  console.log(C.bold + C.brightBlue + '└───────────────────────────────────────────────────────────────────────────────────┘' + C.reset + '\n');

  console.log(C.bold + C.brightYellow + '┌─ 👤 VISITOR & JUDGE JOURNEYS ──────────────────────────────────────────────────────┐' + C.reset);
  if (sessions.size === 0) {
    console.log((C.brightYellow + '│' + C.reset + '  ' + C.dim + 'No user sessions recorded for the selected time window.' + C.reset).padEnd(95) + C.brightYellow + '│' + C.reset);
    console.log((C.brightYellow + '│' + C.reset + '  ' + C.cyan + 'Whenever a judge opens the website, their journey will stream here automatically.' + C.reset).padEnd(95) + C.brightYellow + '│' + C.reset);
  } else {
    let sIdx = 1;
    for (const [sid, sess] of sessions.entries()) {
      const durationSec = Math.max(1, Math.round((new Date(sess.lastSeen) - new Date(sess.firstSeen)) / 1000));
      const durStr = durationSec > 60 ? Math.floor(durationSec / 60) + 'm ' + (durationSec % 60) + 's' : durationSec + 's';
      const badge = sess.userKind === 'ca' ? C.bgMagenta + ' CA ' + C.reset : sess.userKind === 'demo' ? C.bgBlue + ' DEMO CITIZEN ' + C.reset : C.bgGreen + ' REAL USER ' + C.reset;

      console.log('\n  ' + C.bold + '#' + (sIdx++) + ' ' + badge + ' ' + C.brightGreen + sess.userName + C.reset + ' (' + C.yellow + sess.pan + C.reset + ')');
      console.log('     ' + C.dim + 'Session ID:' + C.reset + ' ' + sess.id + ' | ' + C.dim + 'Started:' + C.reset + ' ' + formatTime(sess.firstSeen) + ' | ' + C.dim + 'Duration:' + C.reset + ' ' + durStr + ' | ' + C.dim + 'Lang:' + C.reset + ' ' + sess.lang.toUpperCase());
      if (sess.screenSize) console.log('     ' + C.dim + 'Device Viewport:' + C.reset + ' ' + sess.screenSize + ' | ' + C.dim + 'Client:' + C.reset + ' ' + sess.userAgent.slice(0, 70) + '...');

      if (sess.events.length > 0) {
        console.log('     ' + C.bold + 'Action Timeline:' + C.reset);
        for (const evt of sess.events) {
          const tStr = formatTime(evt.created_at);
          let label = evt.event_type;
          let icon = '•';
          const d = typeof evt.details === 'string' ? JSON.parse(evt.details || '{}') : (evt.details || {});

          if (evt.event_type === 'sign_in') {
            icon = '🔑';
            label = 'Signed in (' + (d.method || 'PAN/Auth') + ')';
          } else if (evt.event_type === 'sign_out') {
            icon = '🚪';
            label = 'Signed out';
          } else if (evt.event_type === 'page_view') {
            icon = '👁️';
            label = 'Viewed page: ' + (d.path || '/');
          } else if (evt.event_type === 'switch_lang') {
            icon = '🌐';
            label = 'Switched language to: ' + (d.to || d.lang);
          } else if (evt.event_type === 'switch_theme') {
            icon = '🌓';
            label = 'Switched theme to: ' + d.theme;
          } else if (evt.event_type === 'upload_doc') {
            icon = '📄';
            label = 'Uploaded document: ' + (d.filename || 'PDF') + ' (' + (d.kind || 'Form 16') + ')';
          } else if (evt.event_type === 'step_advance') {
            icon = '➡️';
            label = 'Navigated to flow step: ' + d.step;
          } else if (evt.event_type === 'compute_tax') {
            icon = '🧮';
            label = 'Computed tax: Salary ₹' + (d.grossSalary || 0).toLocaleString('en-IN') + ' → Tax: ₹' + (d.tax || 0).toLocaleString('en-IN');
          } else if (evt.event_type === 'regime_select') {
            icon = '⚖️';
            label = 'Selected regime: ' + (d.regime || '').toUpperCase() + ' (Saved ₹' + (d.savings || 0).toLocaleString('en-IN') + ')';
          } else if (evt.event_type === 'dispute_create') {
            icon = '🛡️';
            label = 'Disputed fact: ' + d.label + ' (Reason: ' + d.reason + ')';
          } else if (evt.event_type === 'challan_pay') {
            icon = '💳';
            label = 'Paid Self-Assessment Tax / Challan 280: ₹' + (d.amount || 0).toLocaleString('en-IN');
          } else if (evt.event_type === 'itrv_download') {
            icon = '📜';
            label = 'Generated & Downloaded official ITR-V Ack Receipt PDF';
          } else if (evt.event_type === 'agent_prompt') {
            icon = '💬';
            label = 'Asked Munshi: "' + (d.prompt || d.text) + '"';
          } else if (evt.event_type === 'agent_reply') {
            icon = '🤖';
            label = 'Munshi replied in ' + (d.durationMs ? d.durationMs + 'ms' : 'fast stream');
          } else if (evt.event_type === 'mic_dictation') {
            icon = '🎙️';
            label = 'Used voice speech dictation: "' + (d.spokenText || '') + '"';
          } else if (evt.event_type === 'ca_register') {
            icon = '🧑‍⚖️';
            label = 'Registered as Chartered Accountant: ' + d.name + ' (' + d.membershipNo + ')';
          }

          console.log('       ' + C.dim + '[' + tStr + ']' + C.reset + ' ' + icon + ' ' + C.brightCyan + label + C.reset);
        }
      }

      if (sess.chats.length > 0) {
        console.log('     ' + C.bold + C.brightYellow + 'AI / Munshi ji Conversation:' + C.reset);
        for (const chat of sess.chats) {
          console.log('       ' + C.dim + 'Task: ' + chat.run.task + ' | Status: ' + chat.run.status + C.reset);
          for (const ev of chat.events) {
            const p = ev.payload || {};
            if (p.type === 'message' && p.role === 'user') {
              console.log('       ' + C.bold + C.brightGreen + 'Judge:' + C.reset + ' "' + p.text + '"');
            } else if (p.type === 'message' && p.role === 'assistant') {
              console.log('       ' + C.bold + C.brightBlue + 'Munshi:' + C.reset + ' ' + p.text.slice(0, 200) + (p.text.length > 200 ? '...' : ''));
            } else if (p.type === 'tool_call') {
              console.log('         ' + C.magenta + '⚡ Tool:' + C.reset + ' ' + p.name + '(' + JSON.stringify(p.args || {}) + ')');
            }
          }
        }
      }
    }
  }
  console.log('\n' + C.bold + C.brightYellow + '└────────────────────────────────────────────────────────────────────────────────────┘' + C.reset);

  if (data.caAccounts.length > 0 || data.caReviews.length > 0) {
    console.log('\n' + C.bold + C.brightMagenta + '┌─ 🏛️ CHARTERED ACCOUNTANT PORTAL ACTIVITY ────────────────────────────────────────┐' + C.reset);
    console.log('  Registered CAs: ' + C.brightGreen + data.caAccounts.length + C.reset + ' | Review Requests: ' + C.brightCyan + data.caReviews.length + C.reset);
    for (const ca of data.caAccounts) {
      console.log('  • ' + C.bold + ca.name + C.reset + ' (ICAI: ' + ca.membership_no + ') - ' + ca.firm_name + ', ' + ca.city + ' [' + ca.email + ']');
    }
    for (const rev of data.caReviews) {
      console.log('  • Review [' + rev.code + '] for PAN: ' + rev.citizen_pan + ' | Status: ' + C.brightYellow + rev.status + C.reset + ' | Mode: ' + rev.mode);
    }
    console.log(C.bold + C.brightMagenta + '└───────────────────────────────────────────────────────────────────────────────────┘' + C.reset);
  }

function stripAnsi(str) {
  return typeof str === 'string' ? str.replace(/\x1b\[[0-9;]*m/g, '') : '';
}

  if (exportReport) {
    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileMd = path.join(reportDir, `activity-report-${timestamp}.md`);
    const reportFileLatestTxt = path.join(reportDir, 'activity-report-latest.txt');
    const reportFileLatestMd = path.join(reportDir, 'activity-report-latest.md');
    
    let text = '================================================================================\n';
    text += '            WAPSI PLATFORM — JUDGE & USER ACTIVITY AUDIT REPORT\n';
    text += '================================================================================\n';
    text += `Generated At : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`;
    text += `Time Range   : ${stripAnsi(filterText)}\n\n`;
    text += '--------------------------------------------------------------------------------\n';
    text += '1. EXECUTIVE SUMMARY METRICS\n';
    text += '--------------------------------------------------------------------------------\n';
    text += `• Unique Visitors / Judges      : ${totalSessions}\n`;
    text += `• AI Conversation Turns (Munshi): ${totalChats}\n`;
    text += `• Vault Documents Uploaded      : ${totalDocs}\n`;
    text += `• Tax Returns Prepared/Filed    : ${totalSnapshots}\n`;
    text += `• CA Review Interactions        : ${totalCAReviews}\n\n`;

    text += '--------------------------------------------------------------------------------\n';
    text += '2. VISITOR & JUDGE JOURNEYS\n';
    text += '--------------------------------------------------------------------------------\n';

    const sessionList = Array.from(sessions.values());
    if (sessionList.length === 0) {
      text += 'No activity recorded for this period.\n';
    } else {
      sessionList.forEach((sess, idx) => {
        const durationSec = Math.max(1, Math.round((new Date(sess.lastSeen) - new Date(sess.firstSeen)) / 1000));
        const durStr = durationSec > 60 ? Math.floor(durationSec / 60) + 'm ' + (durationSec % 60) + 's' : durationSec + 's';
        text += `\n[#${idx + 1}] Session: ${sess.id}\n`;
        text += `     User PAN/Name : ${sess.pan} ${sess.userName ? `(${sess.userName})` : ''} [${sess.userKind.toUpperCase()}]\n`;
        text += `     Started At    : ${formatTime(sess.firstSeen)}\n`;
        text += `     Duration      : ${durStr}\n`;
        text += `     Language      : ${sess.lang}\n`;
        text += `     Device/View   : ${sess.screenSize || 'N/A'}\n`;
        text += `     Summary       : ${sess.events.length} clicks/actions | ${sess.chats.length} Munshi chats\n`;

        if (sess.events.length > 0) {
          text += '\n     Action Timeline:\n';
          for (const evt of sess.events) {
            const tStr = formatTime(evt.created_at);
            const d = typeof evt.details === 'string' ? JSON.parse(evt.details || '{}') : (evt.details || {});
            let label = evt.event_type;
            if (evt.event_type === 'sign_in') label = `User signed in with PAN: ${d.pan || 'N/A'}`;
            else if (evt.event_type === 'sign_out') label = 'User signed out / cleared session';
            else if (evt.event_type === 'doc_upload') label = `Uploaded document: ${d.name || 'File'} (${d.category || 'Vault'})`;
            else if (evt.event_type === 'tab_change') label = `Switched tab to: ${d.tab}`;
            else if (evt.event_type === 'flow_step') label = `Navigated to flow step: ${d.step}`;
            else if (evt.event_type === 'compute_tax') label = `Computed tax: Salary Rs ${(d.grossSalary || 0).toLocaleString('en-IN')} -> Tax: Rs ${(d.tax || 0).toLocaleString('en-IN')}`;
            else if (evt.event_type === 'regime_select') label = `Selected regime: ${(d.regime || '').toUpperCase()} (Saved Rs ${(d.savings || 0).toLocaleString('en-IN')})`;
            else if (evt.event_type === 'dispute_create') label = `Disputed fact: ${d.label} (Reason: ${d.reason})`;
            else if (evt.event_type === 'challan_pay') label = `Paid Self-Assessment Tax / Challan 280: Rs ${(d.amount || 0).toLocaleString('en-IN')}`;
            else if (evt.event_type === 'itrv_download') label = 'Generated & Downloaded official ITR-V Ack Receipt PDF';
            else if (evt.event_type === 'agent_prompt') label = `Asked Munshi: "${d.prompt || d.text}"`;
            else if (evt.event_type === 'agent_reply') label = `Munshi replied in ${d.durationMs ? d.durationMs + 'ms' : 'fast stream'}`;
            else if (evt.event_type === 'mic_dictation') label = `Used voice speech dictation: "${d.spokenText || ''}"`;
            else if (evt.event_type === 'ca_register') label = `Registered CA: ${d.name} (${d.membershipNo})`;

            text += `       [${tStr}] ${label}\n`;
          }
        }

        if (sess.chats.length > 0) {
          text += '\n     AI / Munshi ji Conversation:\n';
          for (const chat of sess.chats) {
            text += `       Task: ${chat.run.task} | Status: ${chat.run.status}\n`;
            for (const ev of chat.events) {
              const p = ev.payload || {};
              if (p.type === 'message' && p.role === 'user') {
                text += `       [Judge/User]: "${p.text}"\n`;
              } else if (p.type === 'message' && p.role === 'assistant') {
                text += `       [Munshi ji ]: ${p.text}\n`;
              } else if (p.type === 'tool_call') {
                text += `         -> Tool: ${p.name}(${JSON.stringify(p.args || {})})\n`;
              }
            }
          }
        }
      });
    }

    if (data.caAccounts.length > 0 || data.caReviews.length > 0) {
      text += '\n--------------------------------------------------------------------------------\n';
      text += '3. CHARTERED ACCOUNTANT PORTAL ACTIVITY\n';
      text += '--------------------------------------------------------------------------------\n';
      text += `Registered CAs: ${data.caAccounts.length} | Review Requests: ${data.caReviews.length}\n`;
      for (const ca of data.caAccounts) {
        text += `• ${ca.name} (ICAI: ${ca.membership_no}) - ${ca.firm_name}, ${ca.city} [${ca.email}]\n`;
      }
      for (const rev of data.caReviews) {
        text += `• Review [${rev.code}] for PAN: ${rev.citizen_pan} | Status: ${rev.status} | Mode: ${rev.mode}\n`;
      }
    }

    fs.writeFileSync(reportFileMd, text, 'utf8');
    fs.writeFileSync(reportFileLatestTxt, text, 'utf8');
    fs.writeFileSync(reportFileLatestMd, text, 'utf8');
    console.log('\n' + C.green + '✓ Full Activity Report exported to:' + C.reset);
    console.log('  📄 Text File : ' + C.bold + reportFileLatestTxt + C.reset);
    console.log('  📜 Markdown  : ' + C.bold + reportFileMd + C.reset + '\n');
  }
}

async function run() {
  try {
    const data = await fetchActivityData();
    if (jsonOutput) {
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    }
    renderTerminalDashboard(data);

    if (live) {
      console.log('\n' + C.brightCyan + '⚡ Live Streaming Active — Watching for new judge interactions every 3 seconds (Press Ctrl+C to exit)...' + C.reset);
      setInterval(async () => {
        try {
          const freshData = await fetchActivityData();
          renderTerminalDashboard(freshData);
          console.log('\n' + C.brightCyan + '⚡ Live Streaming Active — Watching for new judge interactions every 3 seconds (Press Ctrl+C to exit)...' + C.reset);
        } catch (err) {
          console.error('Live polling error:', err.message);
        }
      }, 3000);
    } else {
      await pool.end();
    }
  } catch (err) {
    console.error('Activity inspector failed:', err);
    await pool.end();
    process.exit(1);
  }
}

run();


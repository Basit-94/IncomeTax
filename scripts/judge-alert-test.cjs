#!/usr/bin/env node
/**
 * scripts/judge-alert-test.cjs — sends one test push to the phone through the same ntfy topic the
 * server uses, so the subscription can be checked before a judge ever arrives.
 *
 *   npm run judge-alert:test
 *
 * Reads JUDGE_ALERT_NTFY_TOPIC (required), JUDGE_ALERT_NTFY_URL, JUDGE_ALERT_NTFY_TOKEN and
 * JUDGE_ALERT_CLICK_URL from .env.local / .env / the environment.
 */
const fs = require('fs');
const path = require('path');

for (const f of ['.env.local', '.env']) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const topic = process.env.JUDGE_ALERT_NTFY_TOPIC;
if (!topic) {
  console.error('JUDGE_ALERT_NTFY_TOPIC is not set. Add it to .env.local (and to Vercel) first.');
  process.exit(1);
}
const base = (process.env.JUDGE_ALERT_NTFY_URL || 'https://ntfy.sh').replace(/\/+$/, '');
const headers = { Title: 'Wapsi judge alerts are working', Priority: 'default', Tags: 'white_check_mark' };
if (process.env.JUDGE_ALERT_CLICK_URL) headers.Click = process.env.JUDGE_ALERT_CLICK_URL;
if (process.env.JUDGE_ALERT_NTFY_TOKEN) headers.Authorization = 'Bearer ' + process.env.JUDGE_ALERT_NTFY_TOKEN;

fetch(base + '/' + encodeURIComponent(topic), {
  method: 'POST',
  headers,
  body: 'Test push from ' + require('os').hostname() + ' at ' + new Date().toLocaleString('en-IN') + '. A real alert looks like this.',
})
  .then(async (res) => {
    console.log(res.ok ? 'Sent. Check the ntfy app on your phone.' : 'ntfy answered HTTP ' + res.status + ': ' + (await res.text()));
    process.exit(res.ok ? 0 : 1);
  })
  .catch((err) => {
    console.error('Could not reach ' + base + ': ' + err.message);
    process.exit(1);
  });

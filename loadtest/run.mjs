const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const baseUrl = option("--base-url", "http://127.0.0.1:8080").replace(/\/$/, "");
const requestCount = Number(option("--requests", "100"));
const concurrency = Number(option("--concurrency", "8"));
const seed = option("--seed", "20260825");

if (!Number.isInteger(requestCount) || requestCount < 1 || !Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error("--requests and --concurrency must be positive integers");
}

const journeys = [];
let nextIndex = 0;

function payloadFor(index) {
  return {
    idempotencyKey: `loadtest-${seed}-${index}`,
    citizenReference: `DEMP-${seed}-${String(index).padStart(5, "0")}`,
    assessmentYear: "2026-27",
    ruleSetVersion: "2026-27-new",
    facts: [
      { kind: "salary", amountPaise: 90000000 + (index % 9) * 100000 },
      { kind: "interest", amountPaise: 120000 + (index % 5) * 1000 },
    ],
    claims: [],
    tdsCreditsPaise: 840000,
  };
}

async function jsonRequest(url, init) {
  const response = await fetch(url, init);
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Preserve the HTTP failure even if a server returns no JSON.
  }
  return { response, body };
}

async function poll(submissionId) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = await jsonRequest(`${baseUrl}/api/v1/returns/submissions/${submissionId}`);
    if (!result.response.ok) throw new Error(`status ${result.response.status}`);
    if (result.body.status !== "accepted") return result.body;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("async submission did not complete within 400ms");
}

async function runJourney(index) {
  const payload = payloadFor(index);
  const started = performance.now();
  const first = await jsonRequest(`${baseUrl}/api/v1/returns/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (first.response.status !== 202) throw new Error(`submit status ${first.response.status}`);

  let duplicateMatch = true;
  if (index % 10 === 0) {
    const retry = await jsonRequest(`${baseUrl}/api/v1/returns/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    duplicateMatch = retry.response.status === 202 && retry.body.submissionId === first.body.submissionId;
    if (!duplicateMatch) throw new Error("idempotency retry returned a different receipt");
  }

  const completed = await poll(first.body.submissionId);
  if (completed.status !== "completed" || typeof completed.totalTaxPaise !== "number") {
    throw new Error(`unexpected completion ${JSON.stringify(completed)}`);
  }
  return { durationMs: performance.now() - started, duplicateMatch };
}

async function worker() {
  while (true) {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= requestCount) return;
    const started = performance.now();
    try {
      journeys.push({ ok: true, ...(await runJourney(index)) });
    } catch (error) {
      journeys.push({ ok: false, durationMs: performance.now() - started, error: String(error?.message ?? error) });
    }
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, worker));
const durationMs = performance.now() - started;
const successful = journeys.filter((journey) => journey.ok);
const failures = journeys.filter((journey) => !journey.ok);
const sortedLatencies = successful.map((journey) => journey.durationMs).sort((a, b) => a - b);
const percentile = (fraction) => sortedLatencies.length === 0
  ? null
  : sortedLatencies[Math.min(sortedLatencies.length - 1, Math.floor(sortedLatencies.length * fraction))];
const report = {
  baseUrl,
  syntheticOnly: true,
  requestCount,
  concurrency,
  duplicateChecks: Math.floor((requestCount - 1) / 10) + 1,
  durationMs: Number(durationMs.toFixed(2)),
  logicalRps: Number((requestCount / (durationMs / 1000)).toFixed(2)),
  successfulJourneys: successful.length,
  failedJourneys: failures.length,
  correctnessFailures: failures.length + successful.filter((journey) => !journey.duplicateMatch).length,
  latencyMs: {
    p50: percentile(0.5) === null ? null : Number(percentile(0.5).toFixed(2)),
    p95: percentile(0.95) === null ? null : Number(percentile(0.95).toFixed(2)),
    p99: percentile(0.99) === null ? null : Number(percentile(0.99).toFixed(2)),
  },
  failures: failures.slice(0, 20),
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.correctnessFailures === 0 ? 0 : 1;

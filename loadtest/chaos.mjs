const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const baseUrls = option("--base-urls", "http://127.0.0.1:8500,http://127.0.0.1:8501")
  .split(",").map((url) => url.trim().replace(/\/$/, "")).filter(Boolean);
const requestCount = Number(option("--requests", "1000"));
const concurrency = Number(option("--concurrency", "64"));
const seed = option("--seed", "chaos-20260825");
const journeys = [];
let nextIndex = 0;

function payloadFor(index) {
  return {
    idempotencyKey: `chaos-${seed}-${index}`,
    citizenReference: `DEMP-CHAOS-${seed}-${String(index).padStart(5, "0")}`,
    assessmentYear: "2026-27",
    ruleSetVersion: "2026-27-new",
    facts: [{ kind: "salary", amountPaise: 90000000 + (index % 9) * 100000 }],
    claims: [],
    tdsCreditsPaise: 840000,
  };
}

async function jsonRequest(url, init) {
  const response = await fetch(url, init);
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

async function runJourney(index) {
  const baseUrl = baseUrls[index % baseUrls.length];
  const payload = payloadFor(index);
  const first = await jsonRequest(`${baseUrl}/api/v1/returns/submit`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
  });
  if (first.response.status !== 202) throw new Error(`submit status ${first.response.status}`);
  const retry = await jsonRequest(`${baseUrl}/api/v1/returns/submit`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
  });
  if (retry.response.status !== 202 || retry.body.submissionId !== first.body.submissionId) {
    throw new Error("idempotency receipt mismatch");
  }
  for (let attempt = 0; attempt < 80; attempt++) {
    const status = await jsonRequest(`${baseUrl}/api/v1/returns/submissions/${first.body.submissionId}`);
    if (!status.response.ok) throw new Error(`status ${status.response.status}`);
    if (status.body.status !== "accepted") {
      if (status.body.status !== "completed") throw new Error(`job ${status.body.status}`);
      if (typeof status.body.totalTaxPaise !== "number") throw new Error("missing totalTaxPaise");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("poll timeout");
}

async function worker() {
  while (true) {
    const index = nextIndex++;
    if (index >= requestCount) return;
    const started = performance.now();
    try {
      await runJourney(index);
      journeys.push({ ok: true, durationMs: performance.now() - started });
    } catch (error) {
      journeys.push({ ok: false, durationMs: performance.now() - started, error: String(error?.message ?? error) });
    }
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, worker));
const successful = journeys.filter((journey) => journey.ok);
const failures = journeys.filter((journey) => !journey.ok);
const sorted = successful.map((journey) => journey.durationMs).sort((a, b) => a - b);
const percentile = (fraction) => sorted.length === 0 ? null : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
console.log(JSON.stringify({
  syntheticOnly: true,
  baseUrls,
  requestCount,
  concurrency,
  durationMs: Number((performance.now() - started).toFixed(2)),
  successfulJourneys: successful.length,
  failedJourneys: failures.length,
  correctnessFailures: failures.length,
  latencyMs: Object.fromEntries([0.5, 0.95, 0.99].map((fraction) => [`p${fraction * 100}`, percentile(fraction) === null ? null : Number(percentile(fraction).toFixed(2))])),
  failures: failures.slice(0, 20),
}, null, 2));
process.exitCode = 0;

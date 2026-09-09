/**
 * lib/telemetry/bucket.ts — one place that decides who an activity row belongs to.
 *
 *   agent  : a browser we drove (user_kind 'agent', or webdriver / headless UA)
 *   tester : the team (user_kind 'tester', or any event from a local dev origin)
 *   judge  : everyone else — unmarked visitors on the deployed site
 *
 * The same rule exists twice on purpose: as a TypeScript function for the ingest route
 * (which must decide before the row is written, to fire the phone alert) and as a SQL CASE
 * for the stats route (which filters after the fact). Keep them identical.
 */

export type ViewerBucket = "judge" | "tester" | "agent";

export const LOCAL_ORIGINS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

export function isLocalOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  const host = origin.toLowerCase();
  return LOCAL_ORIGINS.includes(host) || host.endsWith(".local") || host.startsWith("192.168.") || host.startsWith("10.");
}

export function bucketOf(row: { userKind?: string | null; origin?: string | null; automation?: boolean | null }): ViewerBucket {
  if (row.userKind === "agent" || row.automation) return "agent";
  if (row.userKind === "tester" || isLocalOrigin(row.origin)) return "tester";
  return "judge";
}

/** SQL expression yielding the same bucket for a user_activity_events row aliased as `e` (or unaliased). */
export function bucketSql(alias = ""): string {
  const p = alias ? `${alias}.` : "";
  const locals = LOCAL_ORIGINS.map((o) => `'${o}'`).join(", ");
  return `CASE
    WHEN ${p}user_kind = 'agent' OR COALESCE(${p}automation, FALSE) THEN 'agent'
    WHEN ${p}user_kind = 'tester'
      OR LOWER(COALESCE(${p}origin, '')) IN (${locals})
      OR LOWER(COALESCE(${p}origin, '')) LIKE '%.local'
      OR COALESCE(${p}origin, '') LIKE '192.168.%'
      OR COALESCE(${p}origin, '') LIKE '10.%' THEN 'tester'
    ELSE 'judge'
  END`;
}

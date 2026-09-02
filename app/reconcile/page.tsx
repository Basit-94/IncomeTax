"use client";

/**
 * /reconcile — the AIS reconciliation surface, as its own route.
 *
 * WHY THIS EXISTS. The dashboard was previously reachable only through
 * `antigravityUi` in app/page.tsx, and `setAntigravityUi` is never called
 * anywhere — the flag was left behind when the judge sandbox bar was removed on
 * 2026-08-29. So the whole surface, and every fix made to it, rendered for
 * nobody. A route is the smallest honest way to make it reachable without
 * reviving tester chrome inside the main journey.
 *
 * The two surfaces are deliberately separate models, not two views of one:
 * `app/page.tsx` is the event-sourced journey with full provenance per fact,
 * this is the flat confirm/dispute/pay/file matrix. They meet at SYNC_STATE,
 * which pushes prefill one way only.
 *
 * `m` components are strict under LazyMotion, so the wrapper is required here
 * exactly as it is on the main page — without it every animated element throws
 * rather than degrading.
 */

import { LazyMotion, domMax } from "motion/react";
import InteractiveTaxDashboard from "../../components/InteractiveTaxDashboard";

export default function ReconcilePage() {
  return (
    <LazyMotion features={domMax} strict>
      <InteractiveTaxDashboard />
    </LazyMotion>
  );
}

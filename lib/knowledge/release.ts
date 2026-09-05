import { createHash } from "node:crypto";
import { PROVISIONS } from "./provisions";
import { KNOWLEDGE_RELEASE } from "../agentic/flags";
import type { LegalProvision } from "./types";

/** A reviewed release is a checked-in record, never a runtime environment override. */
export const TAX_RELEASE = {
  id: KNOWLEDGE_RELEASE,
  checkedOn: "2026-09-05",
  recheckBy: "2026-10-05",
  review: "engineering_draft" as "engineering_draft" | "tax_reviewed",
  reviewer: null as string | null,
  // SHA-256 of the sorted corpus records, sealed 2026-09-05 after the engineering review. Recompute and re-seal after ANY corpus edit.
  corpusHash: "6c89fb393e29a891688644afd83e337e773bada17eb569e4ba98ba89efba0a00",
};

export function corpusHash(corpus: readonly LegalProvision[] = PROVISIONS): string {
  // All answer-affecting metadata, not only displayed text. Stable record ordering.
  return createHash("sha256").update(JSON.stringify([...corpus].sort((a, b) => a.id.localeCompare(b.id)))).digest("hex");
}

export function releaseHealth(today: string, release = TAX_RELEASE): "ok" | "integrity_failure" | "stale" {
  if (release.id !== KNOWLEDGE_RELEASE || release.corpusHash !== corpusHash()) return "integrity_failure";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || today < release.checkedOn || today > release.recheckBy) return "stale";
  return "ok";
}

export function approvedForAdvice(): boolean {
  return TAX_RELEASE.review === "tax_reviewed" && !!TAX_RELEASE.reviewer;
}

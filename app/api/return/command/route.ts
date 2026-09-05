import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession, returnStoreFor } from "@/lib/server/context";
import type { ReturnCommand } from "@/lib/return/commands";

const AY = "2026-27";

const feedbackCode = z.enum(["CODE_1", "CODE_2", "CODE_3", "CODE_4", "CODE_5"]);
const payment = z.object({
  amount: z.number().int().nonnegative(),
  bsrCode: z.string().min(1),
  challanNo: z.string().min(1),
  date: z.string().min(1),
}).passthrough();
const extracted = z.object({
  pan: z.string().optional(),
  name: z.string().optional(),
  employerName: z.string().optional(),
  grossSalary: z.number().optional(),
  tds: z.number().optional(),
});

/** Runtime validation of the command body (plan §5.2: "runtime-validated"). */
export const commandSchema: z.ZodType<ReturnCommand> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("confirm_fact"), factId: z.string().min(1) }),
  z.object({ type: z.literal("sign_off_all") }),
  z.object({ type: z.literal("correct_fact"), factId: z.string().min(1), amount: z.number(), reason: z.string(), feedbackCode: feedbackCode.optional() }),
  z.object({ type: z.literal("revert_correction"), correctionId: z.string().min(1) }),
  z.object({ type: z.literal("choose_regime"), regime: z.enum(["new", "old"]) }),
  z.object({ type: z.literal("record_payment"), payment }),
  z.object({ type: z.literal("stage_revision") }),
  z.object({
    type: z.literal("import_document"),
    today: z.string(),
    document: z.object({ fileName: z.string(), kind: z.enum(["FORM_16", "AIS"]), ingestedAt: z.string(), extracted }),
  }),
  z.object({ type: z.literal("finalize_filing"), filedAt: z.string(), today: z.string() }),
  z.object({ type: z.literal("declare_income"), kind: z.enum(["salary", "interest", "dividend", "capital_gains", "rent", "other"]), amount: z.number(), label: z.string().min(1).max(80), today: z.string() }),
  z.object({ type: z.literal("declare_claim"), section: z.string().min(2).max(16), amount: z.number(), label: z.string().min(1).max(80), evidenceAttached: z.boolean() }),
]) as z.ZodType<ReturnCommand>;

const envelopeSchema = z.object({
  command: commandSchema,
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(8).max(128),
});

/** Apply one command to the owner's return. Stale revision → 409 with the current snapshot. */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const store = returnStoreFor(guard.services, guard.session);
  if (!store) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_command", issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const result = await store.apply(guard.session.owner, AY, { ...parsed.data, actor: "citizen" });
  if (!result.ok) {
    const status = result.error === "conflict" ? 409 : result.error === "not_found" ? 404 : 422;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { agenticEnabled } from "@/lib/agentic/flags";
import { advance, createRun, publicRun } from "@/lib/agentic/runtime";
import { isLang } from "@/lib/i18n";
import { requireSession, runtimeFor } from "@/lib/server/context";

const createSchema = z.object({
  message: z.string().min(1).max(4000).optional(),
  task: z.enum(["prepare_salaried_return", "compare_regimes", "reconcile_facts", "load_demo", "explain"]).optional(),
  lang: z.string().optional(),
  /** The onboarding profile's seed (2026-09-07) — no identifiers, by construction of `profileSeed`. */
  profile: z
    .object({
      firstName: z.string().max(40).optional(),
      refundAccount: z.string().max(80).optional(),
      residency: z.enum(["resident", "nri", "rnor"]),
      digilockerLinked: z.boolean(),
      mode: z.enum(["simple", "full"]),
    })
    .optional(),
});

/** The owner's chats, newest first. */
export async function GET(req: NextRequest) {
  if (!agenticEnabled()) return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const runs = await deps.store.listRuns(guard.session.owner);
  return NextResponse.json({ ok: true, runs: runs.map(publicRun), durable: guard.services.dbConfigured });
}

/** Start a chat. The first message is classified and the run advances until it needs the citizen. */
export async function POST(req: NextRequest) {
  if (!agenticEnabled()) return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success || (!parsed.data.message && !parsed.data.task)) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const lang = parsed.data.lang && isLang(parsed.data.lang) ? parsed.data.lang : "en";
  const created = await createRun(deps, guard.session.owner, { message: parsed.data.message, task: parsed.data.task, lang, profile: parsed.data.profile });
  const owner = guard.session.owner;
  let run: import("@/lib/agentic/types").Run = created;
  if (run.status === "running") {
    const adv = await advance(deps, owner, run.id, {}, "steps_only").catch(() => null);
    if (adv) run = adv;
  }
  return NextResponse.json({ ok: true, run: publicRun(run), durable: guard.services.dbConfigured }, { status: 201 });
}

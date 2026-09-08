import { NextResponse, type NextRequest } from "next/server";
import { compareReturns } from "@/lib/ca/compare";
import { resolveCa } from "@/lib/ca/server-store";
import { characterPrompt } from "@/lib/agentic/munshi-character";
import { digitsOf, whyRejected } from "@/lib/agentic/say";
import { getServices } from "@/lib/server/context";

type Ctx = { params: Promise<{ code: string }> };

/**
 * Both versions of the return, cross-checked by the engine, with a deterministic recommendation and — when the
 * model is reachable — Munshi ji's two or three sentences about it, checked so no figure appears that the
 * comparison did not produce.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const services = await getServices();
  const review = await services.caStore.getReview(code);
  if (!review) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const ca = await resolveCa(services.caStore, req.headers.get("cookie"));
  const session = await services.sessions.resolve(req.headers.get("cookie"));
  const citizen = session && session.owner.pan.toUpperCase() === review.citizenPan.toUpperCase();
  if (!ca && !citizen) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  if (!review.caPersona) return NextResponse.json({ ok: false, error: "not_reviewed_yet" }, { status: 409 });

  const comparison = compareReturns(review.originalPersona, review.originalRegime, review.caPersona, review.caRegime ?? review.originalRegime);
  const comments = await services.caStore.listComments(review.code);
  let narrative: string | null = null;
  if (services.model.name !== "none") {
    const facts = [
      `Original: ${comparison.original.regime} regime, total tax ₹${comparison.original.totalTax.toLocaleString("en-IN")}, ${comparison.original.refundOrDue >= 0 ? "refund" : "due"} ₹${Math.abs(comparison.original.refundOrDue).toLocaleString("en-IN")}.`,
      `CA version (${review.caDetails?.name ?? review.claimedByCaName ?? "the CA"}): ${comparison.ca.regime} regime, total tax ₹${comparison.ca.totalTax.toLocaleString("en-IN")}, ${comparison.ca.refundOrDue >= 0 ? "refund" : "due"} ₹${Math.abs(comparison.ca.refundOrDue).toLocaleString("en-IN")}.`,
      `Changes: ${comparison.changes.map((c) => `${c.label} ${typeof c.from === "number" ? `₹${c.from.toLocaleString("en-IN")}` : c.from} → ${typeof c.to === "number" ? `₹${c.to.toLocaleString("en-IN")}` : c.to}`).join("; ") || "none"}.`,
      `Flags: ${comparison.flags.map((f) => `[${f.severity}] ${f.text}`).join(" ") || "none"}.`,
      `Engine recommendation: ${comparison.recommendation.pick}. ${comparison.recommendation.reasons.join(" ")}`,
      ...(comments.length ? [`The CA's comments: ${comments.map((c) => `(${c.anchor}) ${c.text}`).join(" | ")}`] : []),
    ];
    const out = await services.model.converse({
      system: [characterPrompt({ surface: "agentic", langEnglishName: "English" }), "The person is looking at two versions of their return side by side — theirs and a Chartered Accountant's. Say, in two or three plain sentences, which one to go with and why, using only the facts given. Name the CA's flagged risks if there are any. No headings, no lists, no figures that are not in the facts."].join("\n\n"),
      messages: [{ role: "user", text: facts.join("\n") }],
      tools: [],
      lang: "en",
      temperature: 0.5,
    }).catch(() => null);
    if (out?.text && !whyRejected(out.text, { allowed: digitsOf(facts.join(" ")), actionHappened: false, maxWords: 140 })) narrative = out.text.trim();
  }
  return NextResponse.json({ ok: true, comparison, comments, narrative, reviewedBy: review.caDetails ?? (review.claimedByCaName ? { name: review.claimedByCaName } : null) });
}

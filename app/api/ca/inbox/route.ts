import { NextResponse, type NextRequest } from "next/server";
import { publicAccount, publicReview } from "@/lib/ca/server-actions";
import { resolveCa } from "@/lib/ca/server-store";
import { getServices } from "@/lib/server/context";

/** A signed-in CA's dashboard: broadcast requests nobody has taken, and the ones this CA holds or finished. */
export async function GET(req: NextRequest) {
  const services = await getServices();
  const ca = await resolveCa(services.caStore, req.headers.get("cookie"));
  if (!ca) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  const { open, mine } = await services.caStore.listReviewsForCa(ca.id);
  return NextResponse.json({ ok: true, account: publicAccount(ca), open: open.map(publicReview), mine: mine.map(publicReview) });
}

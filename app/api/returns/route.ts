import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { getFiledReturn, saveFiledReturn } from "@/lib/harness/returns";
import { everifyDeadline } from "@/lib/tools";
import { audit } from "@/lib/server/vault";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

/** The account's filed return, and the mock e-verification step (plan task 4.3). */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const filed = getFiledReturn(user.id);
  return NextResponse.json({
    filed: filed
      ? { ackNumber: filed.ackNumber, filedAt: filed.filedAt, form: filed.form, regime: filed.regime, refundOrDue: filed.breakdown.refundOrDue, totalTax: filed.breakdown.totalTax, everifiedAt: filed.everifiedAt ?? null, everifyBy: everifyDeadline(filed.filedAt) }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const ip = getClientIp(request);
  const rate = checkRateLimit(`otp:${user.id}:${ip}`, 5, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many verification attempts. Please wait a minute." },
      { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } },
    );
  }
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  const filed = getFiledReturn(user.id);
  if (!filed) return NextResponse.json({ error: "nothing_filed", message: "No return has been filed from this account yet." }, { status: 409 });
  if (filed.everifiedAt) return NextResponse.json({ error: "already", message: "This return is already verified." }, { status: 409 });
  // The mock OTP is the same one the sign-in flow uses; knowable from source only.
  if (body.code !== "949494") return NextResponse.json({ error: "wrong_code", message: "That code did not match. The mock code is 949494." }, { status: 422 });
  const everifiedAt = new Date().toISOString();
  saveFiledReturn(user.id, { ...filed, everifiedAt });
  audit(user.id, { actor: "user", action: "return.everified", detail: filed.ackNumber });
  return NextResponse.json({ everifiedAt });
}

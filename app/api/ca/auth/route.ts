import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { loginAccount, publicAccount, registerAccount } from "@/lib/ca/server-actions";
import { caSessionCookie, clearedCaSessionCookie, issueCaSession, resolveCa, revokeCaSession } from "@/lib/ca/server-store";
import { getServices, isSecureRequest } from "@/lib/server/context";

const registerSchema = z.object({
  action: z.literal("register"),
  name: z.string().min(1).max(120),
  membershipNo: z.string().min(5).max(12),
  password: z.string().min(4).max(128),
  firmName: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  email: z.string().max(160).optional(),
  phone: z.string().max(32).optional(),
  specialties: z.array(z.string().max(60)).max(8).optional(),
});
const loginSchema = z.object({ action: z.literal("login"), identifier: z.string().min(1).max(160), password: z.string().min(1).max(128) });
const logoutSchema = z.object({ action: z.literal("logout") });
const schema = z.discriminatedUnion("action", [registerSchema, loginSchema, logoutSchema]);

/** Who is signed in as a CA, if anyone. */
export async function GET(req: NextRequest) {
  const services = await getServices();
  const ca = await resolveCa(services.caStore, req.headers.get("cookie"));
  return NextResponse.json({ ok: true, account: ca ? publicAccount(ca) : null, registeredCount: await services.caStore.countAccounts() });
}

/** Register (and sign in), sign in, or sign out a CA. The cookie is the CA's own, separate from the citizen's. */
export async function POST(req: NextRequest) {
  const services = await getServices();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  const secure = isSecureRequest(req);
  if (parsed.data.action === "logout") {
    await revokeCaSession(services.caStore, req.headers.get("cookie"));
    return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearedCaSessionCookie(secure) } });
  }
  const result = parsed.data.action === "register" ? await registerAccount(services.caStore, parsed.data) : await loginAccount(services.caStore, parsed.data.identifier, parsed.data.password);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  const session = await issueCaSession(services.caStore, result.value.id);
  return NextResponse.json({ ok: true, account: publicAccount(result.value) }, { status: parsed.data.action === "register" ? 201 : 200, headers: { "Set-Cookie": caSessionCookie(session.id, session.expiresAt, secure) } });
}

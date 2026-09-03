import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/session";
import { DIGILOCKER_SCOPE } from "@/lib/server/digilocker";

export const metadata = { title: "DigiLocker consent (mock) — Wapsi" };

/**
 * The consent screen of the mock locker (plan D8). Deliberately not styled like the real
 * one and labelled as a stand-in on every line: nothing here talks to MeitY.
 */
export default async function ConsentPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { state } = await searchParams;
  if (!state) redirect("/vault?digilocker=expired");
  const labels: Record<(typeof DIGILOCKER_SCOPE)[number], string> = {
    pan: "PAN card (number and holder name)",
    aadhaar: "Aadhaar (name, date of birth, last four digits)",
    full_name: "Name as on Aadhaar",
    dob: "Date of birth",
  };
  const allow = `/api/vault/digilocker/callback?state=${encodeURIComponent(state)}&code=mock-${encodeURIComponent(state.slice(0, 8))}`;
  const deny = `/api/vault/digilocker/callback?state=${encodeURIComponent(state)}&error=access_denied`;
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="surface-panel w-full max-w-md p-6 sm:p-8 space-y-5" data-testid="digilocker-consent">
        <p className="inline-flex items-center gap-2 rounded-full border border-warn/50 bg-warn-soft px-3 py-1 text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
          Simulated DigiLocker · no government system is contacted
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Wapsi is asking to read these documents</h1>
        <p className="text-sm leading-relaxed text-ink-2">
          In the real flow this screen belongs to DigiLocker and you sign in with your Aadhaar-linked mobile. Here the documents are invented for account <code className="font-mono">{user.username}</code>.
        </p>
        <ul className="space-y-2 rounded-xl border border-line bg-paper-2 p-4 text-sm text-ink">
          {DIGILOCKER_SCOPE.map((slot) => (
            <li key={slot} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-money" aria-hidden="true" />
              {labels[slot]}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-3">Not shared: salary statements, bank statements, or anything an employer or bank issues. Those are never in DigiLocker.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={allow} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-navy px-5 text-sm font-bold text-white hover:opacity-90" data-testid="consent-allow">
            Allow
          </Link>
          <Link href={deny} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line bg-paper px-5 text-sm font-semibold text-ink hover:bg-paper-3" data-testid="consent-deny">
            Deny
          </Link>
        </div>
      </div>
    </main>
  );
}

import { currentUser } from "@/lib/server/session";
import { listAudit, listDocuments, slotStatuses } from "@/lib/server/vault";
import { recall } from "@/lib/harness/memory";
import { digilockerMode, getLink } from "@/lib/server/digilocker";
import { getFiledReturn } from "@/lib/harness/returns";
import VaultPage from "@/components/vault/vault-page";

export const metadata = { title: "Your vault — Wapsi" };
export const dynamic = "force-dynamic";

/** Documents, details, memory, DigiLocker, audit (plan task 3.4). Server-rendered from the vault. */
export default async function Page({ searchParams }: { searchParams: Promise<{ digilocker?: string }> }) {
  const user = (await currentUser())!;
  const { digilocker } = await searchParams;
  const filed = getFiledReturn(user.id);
  return (
    <VaultPage
      initial={{
        slots: slotStatuses(user.id),
        documents: listDocuments(user.id),
        memories: recall(user.id),
        audit: listAudit(user.id, 60),
        digilocker: { mode: digilockerMode(), link: getLink(user.id) },
        filed: filed ? { ackNumber: filed.ackNumber, filedAt: filed.filedAt, regime: filed.regime, refundOrDue: filed.breakdown.refundOrDue, form: filed.form } : null,
        notice: digilocker ?? null,
      }}
    />
  );
}

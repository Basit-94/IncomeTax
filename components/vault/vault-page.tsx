"use client";

/**
 * The vault page (plan §3.1 `/vault`, task 3.4): what is known, what is missing per task,
 * documents with upload, what Wapsi remembers (deletable), the DigiLocker link, and the
 * audit trail. Values never appear; only masks, sources and dates.
 */
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Circle, FileText, Link2, Link2Off, RefreshCw, Trash2, Upload } from "lucide-react";
import type { AuditRow, SlotStatus, StoredDocumentMeta } from "@/lib/server/vault";
import type { Memory } from "@/lib/harness/memory";
import type { DigiLockerLink, DigiLockerMode } from "@/lib/server/digilocker";
import { TASKS } from "@/lib/harness/tasks";
import { formatMoney } from "@/lib/money";
import { useUser } from "@/lib/user-context";
import ModeSwitch from "@/components/agentic/mode-switch";
import { LogoMark } from "@/components/brand/logo";

export interface VaultInitial {
  slots: Record<string, SlotStatus>;
  documents: StoredDocumentMeta[];
  memories: Memory[];
  audit: AuditRow[];
  digilocker: { mode: DigiLockerMode; link: DigiLockerLink | null };
  filed: { ackNumber: string; filedAt: string; regime: string; refundOrDue: number; form: string } | null;
  notice: string | null;
}

const NOTICES: Record<string, string> = {
  connected: "DigiLocker (mock) connected. PAN, Aadhaar, name and date of birth were pulled into your vault, marked verified.",
  denied: "You declined the DigiLocker consent. Nothing was read.",
  expired: "That DigiLocker request expired. Start again from the button below.",
  failed: "The DigiLocker link could not be completed.",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function VaultPage({ initial }: { initial: VaultInitial }) {
  const router = useRouter();
  const { user } = useUser();
  const [slots, setSlots] = useState(initial.slots);
  const [documents, setDocuments] = useState(initial.documents);
  const [memories, setMemories] = useState(initial.memories);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(initial.notice ? (NOTICES[initial.notice] ?? null) : null);
  const [newMemory, setNewMemory] = useState({ key: "", value: "" });

  const matrix = useMemo(
    () =>
      Object.values(TASKS)
        .filter((task) => task.id !== "demo_persona")
        .map((task) => ({
          task,
          rows: task.slots
            .filter((s, i, arr) => arr.findIndex((o) => o.id === s.id) === i)
            .map((spec) => ({ spec, status: slots[spec.id] ?? null })),
        })),
    [slots],
  );

  const refreshSlots = async () => {
    const res = await fetch("/api/vault/slots");
    if (res.ok) setSlots(((await res.json()) as { slots: Record<string, SlotStatus> }).slots);
  };

  const removeSlot = async (slotId: string) => {
    setBusy(slotId);
    await fetch(`/api/vault/slots?slotId=${encodeURIComponent(slotId)}`, { method: "DELETE" });
    await refreshSlots();
    setBusy(null);
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!(data.get("file") instanceof File) || (data.get("file") as File).size === 0) return;
    setBusy("upload");
    setMessage(null);
    const res = await fetch("/api/vault/documents", { method: "POST", body: data });
    const body = (await res.json()) as { document?: StoredDocumentMeta; extractedSummary?: string | null; message?: string };
    if (res.ok && body.document) {
      setDocuments((current) => [body.document!, ...current.filter((d) => d.id !== body.document!.id)]);
      setMessage(body.extractedSummary ? `Stored. Read from it: ${body.extractedSummary}.` : "Stored. No figures could be read from this file; the assistant will ask for them.");
      form.reset();
    } else {
      setMessage(body.message ?? "The file could not be stored.");
    }
    setBusy(null);
  };

  const forget = async (key?: string) => {
    setBusy(key ?? "all");
    await fetch(key ? `/api/memory?key=${encodeURIComponent(key)}` : "/api/memory", { method: "DELETE" });
    setMemories((current) => (key ? current.filter((m) => m.key !== key) : []));
    setBusy(null);
  };

  const addMemory = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("memory");
    const res = await fetch("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMemory) });
    const body = (await res.json()) as { memory?: Memory; error?: string };
    if (res.ok && body.memory) {
      setMemories((current) => [body.memory!, ...current.filter((m) => m.key !== body.memory!.key)]);
      setNewMemory({ key: "", value: "" });
      setMessage(null);
    } else {
      setMessage(body.error ?? "Not remembered.");
    }
    setBusy(null);
  };

  const digilockerDisconnect = async () => {
    setBusy("digilocker");
    await fetch("/api/vault/digilocker", { method: "DELETE" });
    router.refresh();
    setBusy(null);
  };

  const digilockerPull = async () => {
    setBusy("digilocker");
    const res = await fetch("/api/vault/digilocker", { method: "POST" });
    const body = (await res.json()) as { filled?: SlotStatus[]; skipped?: string[]; error?: string };
    setMessage(res.ok ? `Pulled ${body.filled?.length ?? 0} document(s); ${body.skipped?.length ?? 0} kept as you typed them.` : (body.error ?? "Pull failed."));
    await refreshSlots();
    setBusy(null);
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure? This will permanently delete your account, encrypted vault slots, documents, memories, and chat runs.")) return;
    setBusy("delete-account");
    const res = await fetch("/api/auth/me", { method: "DELETE" });
    if (res.ok) {
      localStorage.clear();
      window.location.href = "/signin";
    } else {
      setMessage("Failed to delete account.");
      setBusy(null);
    }
  };

  const filledCount = Object.keys(slots).length;

  return (
    <div className="service-shell min-h-dvh text-ink">
      <header className="border-b border-line bg-paper-2/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => router.push(user.mode === "manual" ? "/" : "/app")} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft size={16} /> Back
          </button>
          <LogoMark size="sm" />
          <ModeSwitch current={user.mode} onChange={(next) => router.push(next === "manual" ? "/" : "/app")} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8" data-testid="vault-page">
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-money">Your vault</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">What Wapsi holds for you</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
            Details are encrypted with a key only your account unwraps; the assistant sees that a box is filled, never what is in it. Every read is logged below.
          </p>
        </div>

        {message && (
          <p role="status" className="rounded border border-money/40 bg-money-soft px-3 py-2 text-sm text-ink" data-testid="vault-message">
            {message}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="surface-panel p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-ink-3">Details on file</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{filledCount}</p>
          </div>
          <div className="surface-panel p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-ink-3">Documents</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{documents.length}</p>
          </div>
          <div className="surface-panel p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-ink-3">Filed this year</p>
            <p className="mt-1 text-sm font-semibold">
              {initial.filed ? `${initial.filed.form} · ${initial.filed.ackNumber}` : "Not yet"}
            </p>
            {initial.filed && (
              <p className="font-mono text-xs text-ink-3">
                {initial.filed.refundOrDue >= 0 ? `refund ${formatMoney(initial.filed.refundOrDue)}` : `payable ${formatMoney(-initial.filed.refundOrDue)}`} · {when(initial.filed.filedAt)}
              </p>
            )}
          </div>
        </section>

        <section className="surface-panel p-5" data-testid="vault-digilocker">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">DigiLocker</h2>
              <p className="text-sm text-ink-2">
                {initial.digilocker.mode === "mock" ? "Simulated: issued documents are invented for this account." : "Real requester mode."}{" "}
                {initial.digilocker.link ? `Connected ${when(initial.digilocker.link.linkedAt)}.` : "Not connected."}
              </p>
            </div>
            <div className="flex gap-2">
              {initial.digilocker.link ? (
                <>
                  <button type="button" disabled={busy === "digilocker"} onClick={() => void digilockerPull()} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-paper px-4 text-sm font-semibold hover:bg-paper-3">
                    <RefreshCw size={14} /> Pull again
                  </button>
                  <button type="button" disabled={busy === "digilocker"} onClick={() => void digilockerDisconnect()} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-alarm hover:bg-paper-3">
                    <Link2Off size={14} /> Disconnect
                  </button>
                </>
              ) : (
                <a href="/api/vault/digilocker/connect" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-bold text-white hover:opacity-90" data-testid="digilocker-connect">
                  <Link2 size={14} /> Connect DigiLocker
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3" data-testid="vault-matrix">
          <h2 className="text-lg font-bold">What each task needs</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {matrix.map(({ task, rows }) => {
              const have = rows.filter((r) => r.status).length;
              return (
                <div key={task.id} className="surface-panel p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-bold">{task.title}</h3>
                    <span className="font-mono text-xs text-ink-3">
                      {have}/{rows.length} on file
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {rows.map(({ spec, status }) => (
                      <li key={spec.id} className="flex items-center gap-2 text-sm" data-slot-id={spec.id} data-slot-status={status ? "filled" : "missing"}>
                        {status ? <Check size={14} className="shrink-0 text-money" aria-hidden="true" /> : <Circle size={14} className="shrink-0 text-ink-3" aria-hidden="true" />}
                        <span className={status ? "text-ink" : "text-ink-3"}>{spec.label}</span>
                        {status && (
                          <>
                            <span className="ms-auto font-mono text-xs text-ink-3">
                              {status.masked} · {status.source}
                              {status.verified ? " · verified" : ""}
                            </span>
                            <button type="button" aria-label={`Remove ${spec.label}`} disabled={busy === spec.id} onClick={() => void removeSlot(spec.id)} className="rounded p-1 text-ink-3 hover:text-alarm">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                        {!status && <span className="ms-auto text-xs text-ink-3">{spec.required ? "asked when needed" : "optional"}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-panel p-5" data-testid="vault-documents">
          <h2 className="text-lg font-bold">Documents</h2>
          <form onSubmit={upload} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <select name="docType" className="min-h-10 rounded-xl border border-line bg-paper px-3 text-sm" defaultValue="form16">
              <option value="form16">Salary statement (Form 16)</option>
              <option value="bank_statement">Bank interest certificate</option>
              <option value="notice">Notice from the department</option>
              <option value="proof">Proof for a deduction</option>
              <option value="other">Something else</option>
            </select>
            <input name="file" type="file" accept="application/pdf,image/png,image/jpeg" className="min-h-10 flex-1 text-sm" required />
            <button type="submit" disabled={busy === "upload"} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
              <Upload size={14} /> Store
            </button>
          </form>
          <p className="mt-2 text-xs text-ink-3">PDF, PNG or JPEG up to 5 MB. Figures are read from PDFs on the server; the file itself is only ever shown back to you.</p>
          {documents.length > 0 && (
            <ul className="mt-4 divide-y divide-line">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 py-2 text-sm">
                  <FileText size={16} className="shrink-0 text-ink-2" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{doc.filename}</span>
                  <span className="font-mono text-xs text-ink-3">
                    {doc.docType} · {(doc.size / 1024).toFixed(0)} KB · {when(doc.uploadedAt)}
                    {doc.extracted ? " · figures read" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-panel p-5" data-testid="vault-memories">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">What Wapsi remembers about you</h2>
            {memories.length > 0 && (
              <button type="button" disabled={busy === "all"} onClick={() => void forget()} className="text-xs font-semibold text-alarm hover:underline">
                Forget everything
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-2">Facts the assistant learned, never numbers or IDs. Each one is read at the start of every chat.</p>
          {memories.length === 0 ? (
            <p className="mt-3 text-sm text-ink-3">Nothing yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {memories.map((memory) => (
                <li key={memory.key} className="flex items-center gap-3 py-2 text-sm">
                  <span className="font-mono text-xs text-ink-3">{memory.key}</span>
                  <span className="min-w-0 flex-1 truncate text-ink">{memory.value}</span>
                  <span className="font-mono text-[0.68rem] text-ink-3">{when(memory.at)}</span>
                  <button type="button" aria-label={`Forget ${memory.key}`} disabled={busy === memory.key} onClick={() => void forget(memory.key)} className="rounded p-1 text-ink-3 hover:text-alarm">
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addMemory} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input value={newMemory.key} onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })} placeholder="key, e.g. has_two_employers" className="min-h-10 rounded-xl border border-line bg-paper px-3 font-mono text-xs sm:w-56" />
            <input value={newMemory.value} onChange={(e) => setNewMemory({ ...newMemory, value: e.target.value })} placeholder="a fact in plain words" className="min-h-10 flex-1 rounded-xl border border-line bg-paper px-3 text-sm" />
            <button type="submit" disabled={busy === "memory" || !newMemory.key || !newMemory.value} className="min-h-10 rounded-xl border border-line bg-paper px-4 text-sm font-semibold hover:bg-paper-3 disabled:opacity-50">
              Remember
            </button>
          </form>
        </section>

        <section className="surface-panel p-5" data-testid="vault-audit">
          <h2 className="text-lg font-bold">Who read what</h2>
          <p className="mt-1 text-sm text-ink-2">Every time a value was decrypted, written or removed, and by whom.</p>
          {initial.audit.length === 0 ? (
            <p className="mt-3 text-sm text-ink-3">No activity yet.</p>
          ) : (
            <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto font-mono text-xs">
              {initial.audit.map((row) => (
                <li key={row.id} className="flex flex-wrap gap-x-3 py-1.5">
                  <span className="text-ink-3">{when(row.at)}</span>
                  <span className="text-ink">{row.actor}</span>
                  <span className="text-ink-2">{row.action}</span>
                  {row.slotId && <span className="text-ink-3">{row.slotId}</span>}
                  {row.detail && <span className="truncate text-ink-3">{row.detail}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-panel border-alarm/30 p-5" data-testid="vault-danger-zone">
          <h2 className="text-lg font-bold text-alarm">Delete account and all personal data</h2>
          <p className="mt-1 text-sm text-ink-2">
            Permanently remove your account, encrypted vault slots, uploaded documents, learned memories, and interview sessions from the server.
          </p>
          <div className="mt-4">
            <button
              type="button"
              disabled={busy === "delete-account"}
              onClick={() => void deleteAccount()}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-alarm px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete everything
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

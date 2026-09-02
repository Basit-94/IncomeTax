"use client";

/**
 * Challan 280 (ITNS 280) — paying self-assessment tax u/s 140A before filing.
 *
 * This exists because of a rule citizens routinely get caught by: a return filed
 * with tax still outstanding is defective under s.139(9). So when the return
 * computes to a balance payable, the journey cannot end at "Continue to File" —
 * it has to route through payment first, and the challan's BSR code, serial
 * number and date have to come back onto the return as proof.
 *
 * MOCK BOUNDARY, stated on the surface and not only here: nothing is paid. No
 * bank, no NPCI, no department endpoint is contacted. The QR encodes a real
 * UPI intent string but no collect request is raised, and "Simulate payment
 * success" is what advances the state. The BSR code and challan serial are
 * generated locally and are synthetic.
 */

import React, { useEffect, useMemo, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Banknote, Building2, Check, Loader2, QrCode, ShieldAlert, X } from "lucide-react";
import { useTax } from "../context/TaxReturnContext";
import { Rupees } from "./Rupees";
import {
  ASSESSMENT_YEAR,
  CHALLAN_MAJOR_HEAD_LABEL,
  CHALLAN_MINOR_HEAD_LABEL,
  CHALLAN_TYPE,
  FINANCIAL_YEAR,
  NET_BANKING_BANKS,
  UPI_QR_TTL_SECONDS,
  splitTaxAndCess,
  syntheticChallanIdentifiers,
  upiDeepLink,
} from "../lib/compliance/challan280";

interface Challan280ModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired after the payment is recorded, so the caller can advance the flow. */
  onPaid?: () => void;
}

type PaymentMethod = "UPI" | "NET_BANKING";
type Stage = "select" | "processing" | "done";

const spring = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.7 };

function mmss(totalSeconds: number): string {
  const m2 = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m2}:${String(s).padStart(2, "0")}`;
}

export function Challan280Modal({ open, onClose, onPaid }: Challan280ModalProps) {
  const { state, netPayable, dispatch } = useTax();

  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [bank, setBank] = useState<string>(NET_BANKING_BANKS[0].code);
  const [stage, setStage] = useState<Stage>("select");
  const [secondsLeft, setSecondsLeft] = useState(UPI_QR_TTL_SECONDS);
  const [receipt, setReceipt] = useState<{ bsrCode: string; challanNo: string } | null>(null);

  // The amount is frozen when the drawer opens. Letting it track live state
  // would mean the citizen pays one figure and the challan records another if
  // anything recalculates mid-payment.
  const [amountDue, setAmountDue] = useState(0);
  useEffect(() => {
    if (open) {
      setAmountDue(Math.round(netPayable));
      setStage("select");
      setReceipt(null);
      setSecondsLeft(UPI_QR_TTL_SECONDS);
    }
    // netPayable is deliberately not a dependency: freezing on open is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A UPI collect request really does expire. Showing the countdown is not
  // decoration — it tells the citizen why the QR stops working.
  useEffect(() => {
    if (!open || stage !== "select" || method !== "UPI") return;
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [open, stage, method, secondsLeft]);

  const { baseTax, cess } = useMemo(() => splitTaxAndCess(amountDue), [amountDue]);
  const challanRef = useMemo(
    () => `WAPSI${state.pan.slice(0, 5)}${amountDue}`,
    [state.pan, amountDue],
  );
  const deepLink = useMemo(
    () => upiDeepLink(amountDue, challanRef),
    [amountDue, challanRef],
  );

  function simulateSuccess(): void {
    setStage("processing");
    // A visible settlement pause: a payment that returns instantly reads as fake
    // and hides the state the citizen would really be waiting in.
    setTimeout(() => {
      const ids = syntheticChallanIdentifiers(amountDue * 31 + state.pan.length);
      const payment = {
        ...ids,
        amount: amountDue,
        date: new Date().toISOString().slice(0, 10),
        majorHead: CHALLAN_MAJOR_HEAD_LABEL,
        minorHead: CHALLAN_MINOR_HEAD_LABEL,
        method,
        bank:
          method === "NET_BANKING"
            ? NET_BANKING_BANKS.find((b) => b.code === bank)?.name
            : undefined,
      } as const;
      dispatch({ type: "ADD_SELF_ASSESSMENT_PAYMENT", payment });
      setReceipt(ids);
      setStage("done");
      onPaid?.();
    }, 1400);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <m.div
        key="challan-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:items-center sm:p-6 print:hidden"
        onClick={onClose}
        role="presentation"
      >
        <m.div
          key="challan-panel"
          layout
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={spring}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Challan 280 — pay self-assessment tax"
          className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-5">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                e-Pay Tax · {CHALLAN_TYPE}
              </span>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Pay outstanding tax — Challan 280
              </h2>
              <p className="text-xs text-slate-500">
                Self-assessment tax u/s 140A. A return filed with tax outstanding is
                defective u/s 139(9), so this is paid before filing.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mock disclosure — first thing inside the panel, not a footnote. */}
          <div className="mx-6 mt-5 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <p className="text-xs leading-relaxed text-amber-900">
              <strong className="font-bold">Nothing is paid here.</strong> No bank, UPI
              app or department system is contacted. The QR encodes a real UPI intent
              string but raises no collect request, and the BSR code and challan serial
              produced below are generated locally and are synthetic.
            </p>
          </div>

          <div className="space-y-6 p-6">
            {/* Challan face — the fields a real ITNS 280 carries. */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Assessment year
                  </dt>
                  <dd className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                    AY {ASSESSMENT_YEAR}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Financial year
                  </dt>
                  <dd className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                    FY {FINANCIAL_YEAR}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    PAN
                  </dt>
                  <dd className="text-sm font-bold text-slate-900 font-mono">{state.pan}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Assessee
                  </dt>
                  <dd className="text-sm font-bold text-slate-900">{state.name}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Major head
                  </dt>
                  <dd className="text-sm font-semibold text-slate-800">
                    {CHALLAN_MAJOR_HEAD_LABEL}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Minor head
                  </dt>
                  <dd className="text-sm font-semibold text-slate-800">
                    {CHALLAN_MINOR_HEAD_LABEL}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <Rupees value={baseTax} className="font-semibold text-slate-900" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Health &amp; education cess @ 4%</span>
                  <Rupees value={cess} className="font-semibold text-slate-900" />
                </div>
                <div className="flex items-center justify-between border-t border-slate-300 pt-2.5">
                  <span className="text-sm font-bold text-slate-900">Total payable</span>
                  <Rupees value={amountDue} className="text-xl font-extrabold text-slate-950" />
                </div>
              </div>
            </section>

            {/* Payment method */}
            {stage === "select" && (
              <section className="space-y-4">
                <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
                  {(
                    [
                      { id: "UPI" as const, label: "UPI", icon: QrCode },
                      { id: "NET_BANKING" as const, label: "Net banking", icon: Building2 },
                    ]
                  ).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setMethod(id)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                        method === id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>

                {/*
                  A plain conditional, not AnimatePresence. `mode="wait"` keeps
                  the outgoing panel mounted until its exit animation finishes,
                  so if the frame loop is stalled — a backgrounded tab, a
                  throttled client, a motion feature bundle that never loads —
                  `method` flips to NET_BANKING while the UPI QR stays on screen.
                  The pay button is live throughout, so the payment would be
                  recorded against a bank the citizen never chose while they were
                  looking at a QR code. What a payment record says must match what
                  was on screen when it was made.
                */}
                {method === "UPI" ? (
                  <m.div
                    key="upi"
                    layout
                    transition={spring}
                    className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 p-6"
                  >
                    <div className="rounded-xl border-4 border-slate-900 bg-white p-3">
                      <QRCodeSVG value={deepLink} size={168} level="M" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">
                        Scan with any UPI app to pay{" "}
                        <Rupees value={amountDue} className="font-bold" />
                      </p>
                      <p
                        className={`mt-1 text-xs font-mono tabular-nums ${
                          secondsLeft <= 30 ? "text-rose-600 font-bold" : "text-slate-500"
                        }`}
                        role="timer"
                        aria-live="off"
                      >
                        {secondsLeft > 0
                          ? `Request valid for ${mmss(secondsLeft)}`
                          : "Request expired — reopen to generate a new one"}
                      </p>
                    </div>
                  </m.div>
                ) : (
                  <m.div
                    key="netbanking"
                    layout
                    transition={spring}
                    className="space-y-2 rounded-2xl border border-slate-200 p-6"
                  >
                    <label
                      htmlFor="challan-bank"
                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Select your bank
                    </label>
                    <select
                      id="challan-bank"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      {NET_BANKING_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <p className="pt-1 text-xs text-slate-500">
                      You would be redirected to your bank&apos;s net-banking login. No
                      redirect happens in this prototype.
                    </p>
                  </m.div>
                )}

                <button
                  onClick={simulateSuccess}
                  disabled={amountDue <= 0}
                  className="w-full rounded-xl bg-teal-800 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
                >
                  Simulate payment success
                </button>
              </section>
            )}

            {stage === "processing" && (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 size={28} className="animate-spin text-teal-700" />
                <p className="text-sm font-semibold text-slate-700">
                  Awaiting confirmation from the collecting bank…
                </p>
              </div>
            )}

            {stage === "done" && receipt && (
              <m.section
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="space-y-4 rounded-2xl border border-emerald-300 bg-emerald-50/60 p-6"
              >
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-emerald-600 p-1.5 text-white">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <h3 className="text-sm font-extrabold text-emerald-900">
                    Challan 280 paid — credit applied to this return
                  </h3>
                </div>
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                      BSR code
                    </dt>
                    <dd className="text-sm font-bold text-emerald-950 font-mono tabular-nums">
                      {receipt.bsrCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                      Challan serial
                    </dt>
                    <dd className="text-sm font-bold text-emerald-950 font-mono tabular-nums">
                      {receipt.challanNo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                      Amount
                    </dt>
                    <dd>
                      <Rupees value={amountDue} className="text-sm font-bold text-emerald-950" />
                    </dd>
                  </div>
                </dl>
                <p className="flex items-start gap-2 text-xs leading-relaxed text-emerald-900">
                  <Banknote size={14} className="mt-0.5 shrink-0" />
                  These three fields — BSR code, serial and date — are what the return
                  carries as proof of payment. Your outstanding liability is now nil.
                </p>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 cursor-pointer"
                >
                  Back to the return
                </button>
              </m.section>
            )}
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}

export default Challan280Modal;

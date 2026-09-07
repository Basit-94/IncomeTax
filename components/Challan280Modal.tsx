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
import { Banknote, Building2, Check, Loader2, QrCode, X } from "lucide-react";
import { MunshiAvatar } from "./brand/munshi";
import { useTax } from "../context/TaxReturnContext";
import type { SelfAssessmentPayment } from "../context/TaxReturnContext";
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
  /**
   * The balance to collect. Defaults to the context's net payable; the main
   * journey passes its own engine figure so the challan always matches the
   * "balance due" the citizen was just shown, even where the two models
   * differ on a claim the reconciliation surface does not carry.
   */
  amount?: number;
  /** Fired after the payment is recorded, with the challan, so the caller can mirror it. */
  onPaid?: (payment: SelfAssessmentPayment) => void;
}

type PaymentMethod = "UPI" | "NET_BANKING";
type Stage = "select" | "processing" | "done";

const spring = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.7 };

function mmss(totalSeconds: number): string {
  const m2 = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m2}:${String(s).padStart(2, "0")}`;
}

export function Challan280Modal({ open, onClose, onPaid, amount }: Challan280ModalProps) {
  const { state, netPayable, dispatch } = useTax();
  const due = amount ?? netPayable;

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
      setAmountDue(Math.round(due));
      setStage("select");
      setReceipt(null);
      setSecondsLeft(UPI_QR_TTL_SECONDS);
    }
    // `due` is deliberately not a dependency: freezing on open is the point.
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
      // Seeded by amount, PAN and the payment's ordinal, so two challans for
      // the same sum do not come back with the same BSR code and serial.
      const panSeed = [...state.pan].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7);
      const ids = syntheticChallanIdentifiers(
        amountDue * 31 + panSeed + state.selfAssessmentPayments.length * 1_000_003,
      );
      const payment: SelfAssessmentPayment = {
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
      };
      dispatch({ type: "ADD_SELF_ASSESSMENT_PAYMENT", payment });
      setReceipt(ids);
      setStage("done");
      onPaid?.(payment);
    }, 1400);
  }

  if (!open) return null;

  const payee = new URLSearchParams(deepLink.split("?")[1] ?? "").get("pa") ?? "";
  const canPay = stage === "select" && amountDue > 0 && !(method === "UPI" && secondsLeft <= 0);

  return (
    <AnimatePresence>
      <m.div
        key="challan-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(27,17,64,.55)] backdrop-blur-sm p-0 sm:items-center sm:p-6 print:hidden"
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
          className="w-full max-w-[720px] max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:sheet-m rounded-[26px] bg-paper text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)]"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-3.5 ink-surface text-on-ink px-6 py-[18px]">
            <span className="size-[42px] rounded-[14px] bg-white/10 flex items-center justify-center shrink-0">
              <Banknote size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-extrabold leading-tight">Pay tax · Challan 280</h2>
              <p className="text-[12.5px] text-[#CDBDFF] truncate">Balance payable before filing · {state.name}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-[10px] p-2 text-on-ink/70 transition hover:bg-white/10 hover:text-on-ink cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-[22px] space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Challan face — the fields a real ITNS 280 carries. */}
              <section className="space-y-2.5">
                <span className="block text-[12px] font-bold uppercase tracking-[.08em] text-ink-3">
                  {CHALLAN_TYPE} · self-assessment
                </span>
                {(
                  [
                    ["Major head", CHALLAN_MAJOR_HEAD_LABEL],
                    ["Minor head", CHALLAN_MINOR_HEAD_LABEL],
                    ["Assessment year", ASSESSMENT_YEAR],
                    ["Financial year", FINANCIAL_YEAR],
                    ["PAN", state.pan],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="glass-flat flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-3 text-[13.5px]">
                    <span className="text-ink-3">{label}</span>
                    <span className="font-mono font-bold text-ink text-end">{value}</span>
                  </div>
                ))}
                <div className="rounded-[14px] bg-amber-bg p-3.5">
                  <div className="flex items-center justify-between gap-2 text-[12px] text-amber-ink">
                    <span className="font-bold">Amount payable</span>
                    <span className="font-mono">
                      tax <Rupees value={baseTax} /> + cess <Rupees value={cess} />
                    </span>
                  </div>
                  <Rupees
                    value={amountDue}
                    className="mt-1 block text-[30px] leading-none font-extrabold tracking-[-.03em] text-amber-ink"
                  />
                </div>
              </section>

              {/* Payment */}
              {stage === "select" && (
                <section className="glass-flat flex flex-col items-center gap-2.5 rounded-[18px] p-4">
                  {/*
                    A plain conditional, not AnimatePresence: with `mode="wait"` a stalled frame
                    loop would leave the UPI QR on screen after `method` flipped to net banking,
                    and the pay button is live throughout. What a payment record says must match
                    what was on screen when it was made.
                  */}
                  {method === "UPI" ? (
                    <m.div key="upi" layout transition={spring} className="flex w-full flex-col items-center gap-2.5">
                      <span className="size-[150px] rounded-[12px] bg-white border border-line flex items-center justify-center">
                        <QRCodeSVG value={deepLink} size={126} level="M" />
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                        <span className="size-[7px] rounded-full bg-ok" />
                        e-Pay Tax · UPI (simulated)
                      </span>
                      <span className="font-mono text-[12px] text-ink tracking-[.02em]">{payee}</span>
                      <p
                        className={`text-[11.5px] font-mono tabular-nums ${
                          secondsLeft <= 30 ? "text-bad font-bold" : "text-ink-3"
                        }`}
                        role="timer"
                        aria-live="off"
                      >
                        {secondsLeft > 0
                          ? `Request valid for ${mmss(secondsLeft)}`
                          : "Request expired — reopen to generate a new one"}
                      </p>
                    </m.div>
                  ) : (
                    <m.div key="netbanking" layout transition={spring} className="w-full space-y-2">
                      <label htmlFor="challan-bank" className="block text-[12.5px] font-bold text-ink-2">
                        Select your bank
                      </label>
                      <select
                        id="challan-bank"
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        className="w-full cursor-pointer rounded-[14px] border-[1.5px] border-glass-edge bg-white/80 dark:bg-white/10 px-4 h-11 text-sm font-semibold text-ink focus:border-money focus:outline-none"
                      >
                        {NET_BANKING_BANKS.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11.5px] text-ink-3">
                        You would be redirected to your bank&apos;s net-banking login. No redirect
                        happens in this prototype.
                      </p>
                    </m.div>
                  )}
                  <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                    {(
                      [
                        { id: "UPI" as const, label: "UPI", icon: QrCode },
                        { id: "NET_BANKING" as const, label: "Net banking", icon: Building2 },
                      ]
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setMethod(id)}
                        aria-pressed={method === id}
                        className={`inline-flex items-center gap-1.5 px-[11px] py-1 rounded-full text-[12px] font-bold transition cursor-pointer ${
                          method === id
                            ? "ink-surface text-on-ink"
                            : "bg-white/60 dark:bg-white/10 border border-glass-edge text-ink-2 hover:border-money/50"
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {stage === "processing" && (
                <section className="glass-flat flex flex-col items-center justify-center gap-3 rounded-[18px] p-6">
                  <Loader2 size={28} className="animate-spin text-money" />
                  <p className="text-sm font-semibold text-ink-2 text-center">
                    Awaiting confirmation from the collecting bank…
                  </p>
                </section>
              )}

              {stage === "done" && receipt && (
                <m.section
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring}
                  className="space-y-3 rounded-[18px] bg-ok-soft p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full bg-ok p-1.5 text-white">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <h3 className="text-sm font-extrabold text-ok-ink">Challan 280 paid — credit applied to this return</h3>
                  </div>
                  <dl className="space-y-1.5 text-[12.5px] text-ok-ink">
                    {(
                      [
                        ["BSR code", receipt.bsrCode],
                        ["Challan serial", receipt.challanNo],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <dt>{label}</dt>
                        <dd className="font-mono font-bold tabular-nums">{value}</dd>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3">
                      <dt>Amount</dt>
                      <dd>
                        <Rupees value={amountDue} className="font-bold" />
                      </dd>
                    </div>
                  </dl>
                  <p className="text-[11.5px] leading-relaxed text-ok-ink">
                    These three fields — BSR code, serial and date — are what the return carries as
                    proof of payment. Your outstanding liability is now nil.
                  </p>
                </m.section>
              )}
            </div>

            {/* Munshi ji's one line: the mock boundary, on the surface and not in a footnote. */}
            <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
              <MunshiAvatar size={26} />
              <span>
                Nothing is paid to anyone. No bank, UPI app or department system is contacted; the QR
                is a real UPI intent string that raises no collect request, and the BSR code and
                serial are generated locally. Paying here credits a simulated challan against your
                return so filing is no longer defective.
              </span>
            </p>

            <div className="flex justify-end gap-2">
              {stage === "done" ? (
                <button
                  onClick={onClose}
                  className="btn-primary h-[46px] px-5 rounded-[14px] text-[14.5px] cursor-pointer"
                >
                  Back to the return
                </button>
              ) : (
                <>
                  <button onClick={onClose} className="h-[46px] px-5 rounded-[14px] bg-white/60 dark:bg-white/10 border border-glass-edge text-[14.5px] font-semibold text-ink hover:border-money/50 transition cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={simulateSuccess}
                    // An expired UPI request cannot be paid; the citizen reopens the drawer for a
                    // fresh one rather than paying into a dead collect request.
                    disabled={!canPay}
                    className="btn-primary h-[46px] px-5 rounded-[14px] text-[14.5px] inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>Simulate payment of</span>
                    <Rupees value={amountDue} />
                    <span aria-hidden="true">→</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}

export default Challan280Modal;

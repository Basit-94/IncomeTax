"use client";

import { AnimatePresence, m } from "motion/react";
import { Settings, RefreshCw } from "lucide-react";
import type { Persona } from "../../lib/types";
import type { Lang, PersonaId } from "../../lib/types";
import { formatAmount } from "../../lib/money";

interface SandboxDrawerProps {
  showConsole: boolean;
  setShowConsole: (v: boolean) => void;
  simulatedDelay: boolean;
  simulatedError: boolean;
  setSimulatedDelay: (v: boolean) => void;
  setSimulatedError: (v: boolean) => void;
  activePersonaId: PersonaId | "custom" | null;
  persona: Persona | null;
  lang: Lang;
  handleSelectPersona: (id: PersonaId) => void;
  handleLogOut: () => void;
  handleFactAmountChange: (factId: string, val: string) => void;
}

export default function SandboxDrawer({
  showConsole,
  setShowConsole,
  simulatedDelay,
  simulatedError,
  setSimulatedDelay,
  setSimulatedError,
  activePersonaId,
  persona,
  lang,
  handleSelectPersona,
  handleLogOut,
  handleFactAmountChange,
}: SandboxDrawerProps) {
  return (
    <AnimatePresence>
      {showConsole && (
        <m.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-80 bg-paper-2 border-l border-line shadow-2xl z-50 p-6 flex flex-col justify-between text-left"
        >
          <div className="space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Settings size={14} className="text-money" />
                <span>Reviewer Sandbox</span>
              </h3>
              <button 
                onClick={() => setShowConsole(false)}
                className="text-xs text-ink-3 hover:text-ink font-mono font-semibold"
              >
                CLOSE
              </button>
            </div>

            {/* Role Switcher */}
            <div className="space-y-3">
              <span className="block text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
                Quick Switch Persona
              </span>
              
              <div className="space-y-2">
                <button
                  onClick={() => { handleSelectPersona("sunita"); setShowConsole(false); }}
                  className="w-full text-left text-xs bg-paper border border-line rounded p-2.5 hover:border-money transition-colors animate-fade"
                >
                  <div className="font-semibold text-ink">Sunita Devi (Act 1)</div>
                  <span className="text-[0.65rem] text-ink-3 block">Salary Prefill / Zero Tax</span>
                </button>
                <button
                  onClick={() => { handleSelectPersona("rakesh"); setShowConsole(false); }}
                  className="w-full text-left text-xs bg-paper border border-line rounded p-2.5 hover:border-money transition-colors"
                >
                  <div className="font-semibold text-ink">Rakesh Kumar (Act 2)</div>
                  <span className="text-[0.65rem] text-ink-3 block">Tax Notices &amp; Capital Gains Mismatch</span>
                </button>
                <button
                  onClick={() => { handleSelectPersona("priya"); setShowConsole(false); }}
                  className="w-full text-left text-xs bg-paper border border-line rounded p-2.5 hover:border-money transition-colors"
                >
                  <div className="font-semibold text-ink">Priya Sharma (Act 3)</div>
                  <span className="text-[0.65rem] text-ink-3 block">Bank IFSC Stale / Rent Document Hold</span>
                </button>
              </div>
            </div>

            {/* Simulated Latency / Failures */}
            <div className="space-y-4 pt-4 border-t border-line/60">
              <span className="block text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
                Schedule I &mdash; Error Simulations
              </span>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 text-xs text-ink-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulatedError}
                    onChange={(e) => setSimulatedError(e.target.checked)}
                    className="rounded border-line text-money focus:ring-money focus:ring-offset-paper"
                  />
                  <span>Trigger API Gateway Timeout</span>
                </label>

                <label className="flex items-center space-x-3 text-xs text-ink-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulatedDelay}
                    onChange={(e) => setSimulatedDelay(e.target.checked)}
                    className="rounded border-line text-money focus:ring-money focus:ring-offset-paper"
                  />
                  <span>Inject 3s Database Delay</span>
                </label>
              </div>
            </div>

            {/* Custom sandbox configuration adjustments */}
            {activePersonaId === "custom" && persona && (
              <div className="space-y-4 pt-4 border-t border-line/60">
                <span className="block text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
                  Custom Sandbox Editor
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[0.65rem] font-mono text-ink-3 mb-1">Contract Income</label>
                    <div className="flex items-center justify-between bg-paper border border-line rounded p-1.5">
                      <button
                        onClick={() => handleFactAmountChange("custom-salary", (persona.facts[0].amount - 50000).toString())}
                        className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                      >
                        -50K
                      </button>
                      <span className="text-xs font-mono font-bold text-ink">
                        {formatAmount(persona.facts[0].amount, lang)}
                      </span>
                      <button
                        onClick={() => handleFactAmountChange("custom-salary", (persona.facts[0].amount + 50000).toString())}
                        className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                      >
                        +50K
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.65rem] font-mono text-ink-3 mb-1">Savings Interest</label>
                    <div className="flex items-center justify-between bg-paper border border-line rounded p-1.5">
                      <button
                        onClick={() => handleFactAmountChange("custom-interest", (persona.facts[1].amount - 500).toString())}
                        className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                      >
                        -500
                      </button>
                      <span className="text-xs font-mono font-bold text-ink">
                        {formatAmount(persona.facts[1].amount, lang)}
                      </span>
                      <button
                        onClick={() => handleFactAmountChange("custom-interest", (persona.facts[1].amount + 500).toString())}
                        className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                      >
                        +500
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Reset Session */}
          <div className="border-t border-line pt-4 space-y-2">
            <button
              onClick={handleLogOut}
              className="w-full bg-alarm hover:bg-alarm-deep text-paper py-2.5 rounded font-mono font-semibold text-xs transition-colors tracking-wide flex items-center justify-center space-x-1.5"
            >
              <RefreshCw size={12} />
              <span>RESET LOCAL CACHE</span>
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

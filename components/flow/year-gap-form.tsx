"use client";

/**
 * The one form of the yearly intake, on the Manual facts step (2026-09-07). Same field specs as
 * the agent's card (lib/return/year-form.ts), so a group the papers already answer is never shown
 * here either. Chips for choices and multi-selects, mono inputs for figures, one Continue.
 */

import { useState } from "react";
import type { FormField } from "../../lib/agentic/types";
import type { AgenticStrings } from "../../lib/i18n/agenticStrings";
import type { Lang } from "../../lib/types";
import { MunshiAvatar } from "../brand/munshi";
import { localize } from "../mock-i18n";

interface YearGapFormProps {
  lang: Lang;
  s: AgenticStrings;
  fields: FormField[];
  /** Groups the papers answered, named so the person sees why they were not asked. */
  skipped?: string[];
  onSubmit: (values: Record<string, string | number | boolean>) => void;
}

export default function YearGapForm({ lang, s, fields, skipped = [], onSubmit }: YearGapFormProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    for (const f of fields) if (f.defaultValue !== undefined) init[f.key] = typeof f.defaultValue === "boolean" ? f.defaultValue : String(f.defaultValue);
    return init;
  });
  const L = (x: string) => localize(x, lang);
  if (fields.length === 0) return null;

  const toggleMulti = (key: string, value: string) => {
    setValues((v) => {
      const current = String(v[key] ?? "").split(",").filter(Boolean);
      const next = value === "none" ? (current.includes("none") ? [] : ["none"]) : current.includes(value) ? current.filter((x) => x !== value) : [...current.filter((x) => x !== "none"), value];
      return { ...v, [key]: next.join(",") };
    });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, number | boolean | string> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.type === "number") out[f.key] = Number(String(v ?? "").replace(/[^0-9.]/g, "")) || 0;
      else if (f.type === "yes_no") out[f.key] = v === true;
      else if (typeof v === "string" && v) out[f.key] = v;
    }
    onSubmit(out);
  };

  return (
    <form onSubmit={submit} className="glass rounded-[24px] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="shrink-0"><MunshiAvatar size={34} state="guide" /></span>
        <div className="min-w-0 space-y-1">
          <p className="text-[15px] font-extrabold text-ink tracking-[-0.01em]">{L("What the papers can't tell us")}</p>
          {skipped.length > 0 && <p className="text-[12px] text-ink-3">{L("Already answered by your papers:")} {skipped.join(" · ")}</p>}
        </div>
      </div>
      {fields.map((f) => {
        const id = `gap-${f.key}`;
        const carried = f.defaultValue !== undefined && String(values[f.key] ?? "") === String(f.defaultValue);
        return (
          <div key={f.key} className="space-y-1">
            <label className="block text-sm font-semibold text-ink" htmlFor={id}>
              {f.label}
              {carried && <span className="ms-2 inline-block rounded-full bg-amber-bg px-2 py-0.5 text-[10.5px] font-semibold text-amber-ink align-middle">{s.carriedFromLastYear}</span>}
            </label>
            {f.hint && <p className="text-xs text-ink-3">{f.hint}</p>}
            {f.type === "multi" || f.type === "choice" ? (
              <div className="flex flex-wrap gap-2" role="group" aria-label={f.label}>
                {f.choices?.map((c) => {
                  const on = f.type === "multi" ? String(values[f.key] ?? "").split(",").includes(c.value) : values[f.key] === c.value;
                  return (
                    <button key={c.value} type="button" aria-pressed={on} onClick={() => (f.type === "multi" ? toggleMulti(f.key, c.value) : setValues((v) => ({ ...v, [f.key]: c.value })))} className={`rounded-full h-[34px] px-3.5 text-[12.5px] font-semibold cursor-pointer border-[1.5px] transition-colors ${on ? "border-money bg-amber-bg text-amber-ink" : "border-glass-edge glass-flat text-ink-2 hover:text-ink"}`}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            ) : f.type === "yes_no" ? (
              <div className="flex gap-2" role="group" aria-label={f.label}>
                {[true, false].map((b) => (
                  <button key={String(b)} type="button" onClick={() => setValues((v) => ({ ...v, [f.key]: b }))} className={`rounded-[14px] h-[38px] px-4 text-[13px] font-semibold cursor-pointer ${values[f.key] === b ? "ink-surface" : "glass-flat text-ink-2 hover:text-ink"}`}>
                    {b ? s.yes : s.no}
                  </button>
                ))}
              </div>
            ) : (
              <input id={id} inputMode="numeric" placeholder="0" value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className="w-full h-[46px] rounded-[14px] border-[1.5px] border-glass-edge bg-paper-3 px-4 text-[15px] text-ink font-mono tabular-nums focus:outline-none focus:border-money focus:ring-[3px] focus:ring-money/20" />
            )}
          </div>
        );
      })}
      <button type="submit" className="btn-primary rounded-[14px] h-[46px] px-5 text-[14.5px] cursor-pointer">{s.formSubmit}</button>
    </form>
  );
}

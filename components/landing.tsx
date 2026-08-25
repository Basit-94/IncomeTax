"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ChevronRight, Sparkles, Cpu, BookOpen } from "lucide-react";
import type { Dict } from "../lib/i18n";
import { AnimeLens } from "./lens";

interface LandingProps {
  t: Dict;
  panInput: string;
  panInputError: string | null;
  handlePanInputChange: (val: string) => void;
  handlePanSubmit: (e: React.FormEvent) => void;
  handleSelectPersona: (id: "sunita" | "rakesh" | "priya") => void;
  handleCreateCustom: () => void;
}

export default function Landing({
  t,
  panInput,
  panInputError,
  handlePanInputChange,
  handlePanSubmit,
  handleSelectPersona,
  handleCreateCustom,
}: LandingProps) {
  return (
    <div className="grid lg:grid-cols-12 gap-8 items-center min-h-[75vh]">
      {/* LEFT COLUMN: TITLE, SUBTITLE, FORM, CITIZENS LIST */}
      <div className="lg:col-span-7 space-y-8 text-left z-10">
        {/* HERO BLOCK */}
        <div className="space-y-4">
          <span className="text-[11px] font-mono text-money bg-money-soft border border-money/20 px-2.5 py-0.5 rounded uppercase tracking-[0.12em] font-semibold">
            {t.landing.badge}
          </span>
          <h1 className="text-[3.2rem] lg:text-[4rem] font-bold tracking-tight text-ink leading-none font-sans lowercase">
            {t.landing.brandTitle}
          </h1>
          <h2 className="text-[1.6rem] lg:text-[2rem] font-bold tracking-tight text-ink leading-tight font-sans">
            {t.landing.question}
          </h2>
          <p className="text-base text-ink-2 leading-relaxed max-w-xl">
            {t.landing.subtext}
          </p>
        </div>

        {/* DIRECT PAN LOGIN FORM */}
        <form 
          onSubmit={handlePanSubmit}
          className="bg-paper-2 border border-line rounded-[12px] p-6 max-w-md shadow-sm hover:shadow-md transition-shadow space-y-4"
        >
          <div>
            <label className="block text-xs font-mono text-ink-2 uppercase tracking-wider mb-2">
              {t.landing.panLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                value={panInput}
                onChange={(e) => handlePanInputChange(e.target.value)}
                maxLength={10}
                placeholder="e.g. DEMPS4417K"
                className={`w-full bg-paper-3 border ${
                  panInputError ? "border-alarm animate-shake" : "border-line focus:border-money"
                } text-lg font-mono tracking-widest px-4 py-3 rounded-[4px] focus:outline-none transition-colors text-center uppercase text-ink`}
              />
            </div>
            {panInputError ? (
              <span className="block text-xs text-alarm mt-1.5 font-medium">
                {panInputError}
              </span>
            ) : (
              <span className="block text-[0.7rem] text-ink-3 mt-1.5">
                {t.landing.panHelp}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-money-soft hover:translate-y-[1px] hover:translate-x-[1px] text-money text-sm font-semibold py-3 px-4 rounded-[4px] border border-line transition-transform flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{t.landing.check}</span>
            <ChevronRight size={16} />
          </button>
        </form>

        {/* PRE-LOADED MOCK CITIZENS GRID */}
        <div className="space-y-4">
          <span className="block text-xs font-mono text-ink-2 uppercase tracking-wider">
            {t.landing.orTryAs}
          </span>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
            {/* Sunita Devi */}
            <m.div
              whileHover={{ y: 2, x: 2 }}
              onClick={() => handleSelectPersona("sunita")}
              className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Sunita Devi</h3>
                  <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                    {t.personas.sunita.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.sunita.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.sunita.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.div>

            {/* Rakesh Kumar */}
            <m.div
              whileHover={{ y: 2, x: 2 }}
              onClick={() => handleSelectPersona("rakesh")}
              className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Rakesh Kumar</h3>
                  <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                    {t.personas.rakesh.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.rakesh.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.rakesh.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.div>

            {/* Priya Sharma */}
            <m.div
              whileHover={{ y: 2, x: 2 }}
              onClick={() => handleSelectPersona("priya")}
              className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Priya Sharma</h3>
                  <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                    {t.personas.priya.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.priya.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.priya.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.div>

            {/* Seeded Custom Sandbox Mode Card */}
            <m.div
              whileHover={{ y: 2, x: 2 }}
              onClick={handleCreateCustom}
              className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money hover:bg-paper-2/40 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink group-hover:text-money transition-colors flex items-center gap-1.5">
                    <Sparkles size={14} className="text-money animate-pulse" />
                    <span>{t.personas.custom.blurbTitle}</span>
                  </h3>
                  <span className="text-[0.65rem] font-mono bg-money-soft border border-money/20 text-money px-1.5 py-0.5 rounded uppercase">
                    {t.personas.custom.phase}
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  {t.personas.custom.blurb}
                </p>
              </div>
              <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                <span>{t.personas.custom.action}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </m.div>
          </div>
        </div>

        {/* Subfooter route links */}
        <div className="flex items-center space-x-6 pt-6 border-t border-line/60 max-w-md">
          <Link href="/architecture" className="text-xs text-ink-2 hover:text-[#FF4B4B] hover:underline flex items-center gap-1 font-mono">
            <Cpu size={12} />
            <span>{t.landing.architectureLink}</span>
          </Link>
          <Link href="/honesty" className="text-xs text-ink-2 hover:text-[#FF4B4B] hover:underline flex items-center gap-1 font-mono">
            <BookOpen size={12} />
            <span>{t.landing.honestyLink}</span>
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN: ANIMATED 3D CAMERA LENS GRAPHIC */}
      <div className="lg:col-span-5 hidden lg:flex items-center justify-center relative">
        <div className="relative">
          <AnimeLens />
          <div className="absolute bottom-[-20px] right-4 text-[10px] font-mono text-ink-3">
            {t.landing.lensCaption}
          </div>
        </div>
      </div>
    </div>
  );
}

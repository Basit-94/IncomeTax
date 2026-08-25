"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "../lib/types";
import { dict, isLang } from "../lib/i18n";

/** The prototype boundary stays visible on every route and follows the user's locale. */
export default function Disclaimer() {
  const [lang, setLang] = useState<Lang>("en");
  const t = dict(lang);

  useEffect(() => {
    const stored = window.localStorage.getItem("wapsi_lang");
    if (isLang(stored)) setLang(stored);

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "wapsi_lang") return;
      const next = window.localStorage.getItem("wapsi_lang");
      if (isLang(next)) setLang(next);
    };

    const onLocaleChange = () => {
      const next = window.localStorage.getItem("wapsi_lang");
      if (isLang(next)) setLang(next);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("wapsi_lang_change", onLocaleChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("wapsi_lang_change", onLocaleChange);
    };
  }, []);

  return (
    <footer className="border-t border-line bg-paper-2 px-5 py-5 text-[0.78rem] leading-relaxed text-ink-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="max-w-3xl">
          <strong className="font-semibold text-ink">{t.footer.prototype}</strong>{" "}
          {t.footer.notAffiliated}
        </p>
        <Link
          className="shrink-0 font-medium text-money underline decoration-money/30 underline-offset-2 hover:decoration-money"
          href="/honesty"
        >
          {t.footer.honestyLink}
        </Link>
      </div>
    </footer>
  );
}

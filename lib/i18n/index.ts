import type { Lang } from "../types";
import { en, type Dict } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";

export type { Dict };
export { en, hi, ta };

export const DICTS: Record<Lang, Dict> = { en, hi, ta };

/** Switcher order. English first because that's where a reviewer starts. */
export const LANGS: Lang[] = ["en", "hi", "ta"];

export const DEFAULT_LANG: Lang = "en";

/**
 * Each language's name in its own script — the only correct label for a
 * language switcher. "Hindi" written in Latin is useless to someone who is
 * looking for the option because they cannot read Latin.
 */
export const LANG_NATIVE: Record<Lang, string> = {
  en: en.langNativeName,
  hi: hi.langNativeName,
  ta: ta.langNativeName,
};

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "hi" || value === "ta";
}

export function dict(lang: Lang): Dict {
  return DICTS[lang] ?? DICTS[DEFAULT_LANG];
}

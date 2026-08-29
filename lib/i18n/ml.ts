/**
 * TEMPORARY stub so the app compiles while the real Malayalam translation is
 * being written. Translation agent: OVERWRITE this file entirely with the
 * full dictionary. Until then it falls back to English text under the
 * native name — the language-menu footnote already discloses that
 * translations are in progress.
 */
import type { Dict } from "./en";
import { en } from "./en";

export const ml: Dict = {
  ...en,
  langName: "Malayalam",
  langNativeName: "മലയാളം",
  dir: "ltr",
};

export const mlMock: Record<string, string> = {};

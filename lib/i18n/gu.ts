/**
 * TEMPORARY stub so the app compiles while the real Gujarati translation is
 * being written. Translation agent: OVERWRITE this file entirely with the
 * full dictionary. Until then it falls back to English text under the
 * native name — the language-menu footnote already discloses that
 * translations are in progress.
 */
import type { Dict } from "./en";
import { en } from "./en";

export const gu: Dict = {
  ...en,
  langName: "Gujarati",
  langNativeName: "ગુજરાતી",
  dir: "ltr",
};

export const guMock: Record<string, string> = {};

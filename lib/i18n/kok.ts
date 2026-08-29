/**
 * TEMPORARY stub so the app compiles while the real Konkani translation is
 * being written. Translation agent: OVERWRITE this file entirely with the
 * full dictionary. Until then it falls back to English text under the
 * native name — the language-menu footnote already discloses that
 * translations are in progress.
 */
import type { Dict } from "./en";
import { en } from "./en";

export const kok: Dict = {
  ...en,
  langName: "Konkani",
  langNativeName: "कोंकणी",
  dir: "ltr",
};

export const kokMock: Record<string, string> = {};

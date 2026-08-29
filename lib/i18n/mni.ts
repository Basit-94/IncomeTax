/**
 * TEMPORARY stub so the app compiles while the real Manipuri translation is
 * being written. Translation agent: OVERWRITE this file entirely with the
 * full dictionary. Until then it falls back to English text under the
 * native name — the language-menu footnote already discloses that
 * translations are in progress.
 */
import type { Dict } from "./en";
import { en } from "./en";

export const mni: Dict = {
  ...en,
  langName: "Manipuri",
  langNativeName: "ꯃꯤꯇꯩꯂꯣꯟ",
  dir: "ltr",
};

export const mniMock: Record<string, string> = {};

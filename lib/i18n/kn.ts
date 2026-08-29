/**
 * TEMPORARY stub so the app compiles while the real Kannada translation is
 * being written. Translation agent: OVERWRITE this file entirely with the
 * full dictionary. Until then it falls back to English text under the
 * native name — the language-menu footnote already discloses that
 * translations are in progress.
 */
import type { Dict } from "./en";
import { en } from "./en";

export const kn: Dict = {
  ...en,
  langName: "Kannada",
  langNativeName: "ಕನ್ನಡ",
  dir: "ltr",
};

export const knMock: Record<string, string> = {};

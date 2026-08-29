import type { Lang } from "../types";
import { en, type Dict } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";
// The remaining Eighth-Schedule languages. These dictionaries are
// model-generated pending native review (T0.5) — disclosed in each file's
// header and in the language menu.
import { asDict } from "./as";
import { bn } from "./bn";
import { brx } from "./brx";
import { doi } from "./doi";
import { gu } from "./gu";
import { kn } from "./kn";
import { ks } from "./ks";
import { kok } from "./kok";
import { mai } from "./mai";
import { ml } from "./ml";
import { mni } from "./mni";
import { mr } from "./mr";
import { ne } from "./ne";
import { or } from "./or";
import { pa } from "./pa";
import { sa } from "./sa";
import { sat } from "./sat";
import { sd } from "./sd";
import { te } from "./te";
import { ur } from "./ur";

export type { Dict };
export { en, hi, ta };

export const DICTS: Record<Lang, Dict> = {
  en,
  hi,
  ta,
  as: asDict,
  bn,
  brx,
  doi,
  gu,
  kn,
  ks,
  kok,
  mai,
  ml,
  mni,
  mr,
  ne,
  or,
  pa,
  sa,
  sat,
  sd,
  te,
  ur,
};

/** Switcher order. English first because that's where a reviewer starts. */
export const LANGS: Lang[] = [
  "en",
  "hi",
  "ta",
  "as",
  "bn",
  "brx",
  "doi",
  "gu",
  "kn",
  "ks",
  "kok",
  "mai",
  "ml",
  "mni",
  "mr",
  "ne",
  "or",
  "pa",
  "sa",
  "sat",
  "sd",
  "te",
  "ur",
];

export const DEFAULT_LANG: Lang = "en";

/**
 * Each language's name in its own script — the only correct label for a
 * language switcher. "Hindi" written in Latin is useless to someone who is
 * looking for the option because they cannot read Latin.
 */
export const LANG_NATIVE: Record<Lang, string> = Object.fromEntries(
  (Object.entries(DICTS) as [Lang, Dict][]).map(([code, d]) => [code, d.langNativeName]),
) as Record<Lang, string>;

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(DICTS, value);
}

export function dict(lang: Lang): Dict {
  return DICTS[lang] ?? DICTS[DEFAULT_LANG];
}

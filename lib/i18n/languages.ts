import type { Lang } from "../types";

/**
 * Every language the portal offers: the 22 languages of the Eighth Schedule of the
 * Constitution of India, plus English.
 *
 * Each is labelled in its own script. A language switcher that writes "Bengali" in Latin
 * is useless to the person who is looking for it precisely because they cannot read Latin.
 *
 * ── An honest note about `translated` ────────────────────────────────────────────────
 * All 23 languages now carry full dictionaries. English, Hindi and Tamil came first; the
 * other 20 are model-generated translations — disclosed in each dictionary's header and
 * in the language menu — and still need review by people who know both the language and
 * the tax vocabulary (T0.5). This is tax copy: a "standard deduction" that lands slightly
 * wrong does not read as a clumsy sentence — it misleads someone about their own money.
 */
export interface LanguageOption {
  /** ISO 639 code. Also the `Lang` union member once a dictionary exists. */
  code: string;
  /** The language's name in its own script — the label shown in the menu. */
  native: string;
  /** English name, for the `aria-label` and for developers reading this list. */
  english: string;
  /** True only when a real dictionary exists. */
  translated: boolean;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", native: "English", english: "English", translated: true },
  { code: "hi", native: "हिन्दी", english: "Hindi", translated: true },
  { code: "ta", native: "தமிழ்", english: "Tamil", translated: true },

  // ── Eighth Schedule, alphabetical by English name ──────────────────────────
  { code: "as", native: "অসমীয়া", english: "Assamese", translated: true },
  { code: "bn", native: "বাংলা", english: "Bengali", translated: true },
  { code: "brx", native: "बड़ो", english: "Bodo", translated: true },
  { code: "doi", native: "डोगरी", english: "Dogri", translated: true },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati", translated: true },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", translated: true },
  { code: "ks", native: "کٲشُر", english: "Kashmiri", translated: true },
  { code: "kok", native: "कोंकणी", english: "Konkani", translated: true },
  { code: "mai", native: "मैथिली", english: "Maithili", translated: true },
  { code: "ml", native: "മലയാളം", english: "Malayalam", translated: true },
  { code: "mni", native: "ꯃꯤꯇꯩꯂꯣꯟ", english: "Manipuri", translated: true },
  { code: "mr", native: "मराठी", english: "Marathi", translated: true },
  { code: "ne", native: "नेपाली", english: "Nepali", translated: true },
  { code: "or", native: "ଓଡ଼ିଆ", english: "Odia", translated: true },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi", translated: true },
  { code: "sa", native: "संस्कृतम्", english: "Sanskrit", translated: true },
  { code: "sat", native: "ᱥᱟᱱᱛᱟᱲᱤ", english: "Santali", translated: true },
  { code: "sd", native: "سنڌي", english: "Sindhi", translated: true },
  { code: "te", native: "తెలుగు", english: "Telugu", translated: true },
  { code: "ur", native: "اردو", english: "Urdu", translated: true },
];

/** Right-to-left scripts, so the menu can set `dir` correctly. */
const RTL = new Set(["ks", "sd", "ur"]);

export const isRtl = (code: string) => RTL.has(code);

export const availableLanguages = () => LANGUAGE_OPTIONS.filter((l) => l.translated);

export const pendingLanguages = () => LANGUAGE_OPTIONS.filter((l) => !l.translated);

export const languageOption = (code: string) =>
  LANGUAGE_OPTIONS.find((l) => l.code === code) ?? LANGUAGE_OPTIONS[0];

/** Narrows a picker choice to a language that actually has a dictionary. */
export function toLang(code: string): Lang | null {
  const option = LANGUAGE_OPTIONS.find((l) => l.code === code);
  return option?.translated ? (option.code as Lang) : null;
}

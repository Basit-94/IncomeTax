import type { Lang } from "../types";

/**
 * Every language the portal offers: the 22 languages of the Eighth Schedule of the
 * Constitution of India, plus English.
 *
 * Each is labelled in its own script. A language switcher that writes "Bengali" in Latin
 * is useless to the person who is looking for it precisely because they cannot read Latin.
 *
 * ── An honest note about `translated` ────────────────────────────────────────────────
 * Only English, Hindi and Tamil have real dictionaries today. The rest are listed but not
 * yet selectable, and that is deliberate: this is tax copy. A machine-translated
 * "standard deduction" or "assessment year" that lands slightly wrong does not read as a
 * clumsy sentence — it misleads someone about their own money. These need translation by
 * people who know both the language and the tax vocabulary, and until then showing the
 * option as pending is more honest than shipping a guess.
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
  { code: "as", native: "অসমীয়া", english: "Assamese", translated: false },
  { code: "bn", native: "বাংলা", english: "Bengali", translated: false },
  { code: "brx", native: "बड़ो", english: "Bodo", translated: false },
  { code: "doi", native: "डोगरी", english: "Dogri", translated: false },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati", translated: false },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", translated: false },
  { code: "ks", native: "کٲشُر", english: "Kashmiri", translated: false },
  { code: "kok", native: "कोंकणी", english: "Konkani", translated: false },
  { code: "mai", native: "मैथिली", english: "Maithili", translated: false },
  { code: "ml", native: "മലയാളം", english: "Malayalam", translated: false },
  { code: "mni", native: "ꯃꯤꯇꯩꯂꯣꯟ", english: "Manipuri", translated: false },
  { code: "mr", native: "मराठी", english: "Marathi", translated: false },
  { code: "ne", native: "नेपाली", english: "Nepali", translated: false },
  { code: "or", native: "ଓଡ଼ିଆ", english: "Odia", translated: false },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi", translated: false },
  { code: "sa", native: "संस्कृतम्", english: "Sanskrit", translated: false },
  { code: "sat", native: "ᱥᱟᱱᱛᱟᱲᱤ", english: "Santali", translated: false },
  { code: "sd", native: "سنڌي", english: "Sindhi", translated: false },
  { code: "te", native: "తెలుగు", english: "Telugu", translated: false },
  { code: "ur", native: "اردو", english: "Urdu", translated: false },
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

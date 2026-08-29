import type { Lang } from "../types";
// Persona/mock-narrative strings for the 20 model-translated languages.
// English, Hindi and Tamil live in components/mock-i18n.ts (keyed the other
// way round, string → language); these tables are keyed language → string so
// each language file stays self-contained for its human reviewer (T0.5).
import { asMock } from "./as";
import { bnMock } from "./bn";
import { brxMock } from "./brx";
import { doiMock } from "./doi";
import { guMock } from "./gu";
import { knMock } from "./kn";
import { ksMock } from "./ks";
import { kokMock } from "./kok";
import { maiMock } from "./mai";
import { mlMock } from "./ml";
import { mniMock } from "./mni";
import { mrMock } from "./mr";
import { neMock } from "./ne";
import { orMock } from "./or";
import { paMock } from "./pa";
import { saMock } from "./sa";
import { satMock } from "./sat";
import { sdMock } from "./sd";
import { teMock } from "./te";
import { urMock } from "./ur";

/** English source string → translation, per language. */
export const EXTRA_MOCK: Partial<Record<Lang, Record<string, string>>> = {
  as: asMock,
  bn: bnMock,
  brx: brxMock,
  doi: doiMock,
  gu: guMock,
  kn: knMock,
  ks: ksMock,
  kok: kokMock,
  mai: maiMock,
  ml: mlMock,
  mni: mniMock,
  mr: mrMock,
  ne: neMock,
  or: orMock,
  pa: paMock,
  sa: saMock,
  sat: satMock,
  sd: sdMock,
  te: teMock,
  ur: urMock,
};

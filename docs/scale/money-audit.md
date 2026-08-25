# Money representation audit

Audited 25 August 2026 as part of Workstream 2 B.1.

## Existing TypeScript path

- `lib/money.ts` uses `Intl.NumberFormat` only for presentation. It does not call
  `parseFloat`, `toFixed`, or a floating-point conversion API.
- Its public inputs are nevertheless whole-rupee JavaScript `number` values. That is not an
  integer-paise contract and JavaScript numbers are not an acceptable long-term currency type at
  an API boundary.
- `lib/engine/constants.ts` stores rates such as `0.05` as JavaScript numbers, and
  `lib/engine/slab.ts` multiplies rupee amounts by those rates before `Math.round`. This is the
  current prototype arithmetic path, not an exact-paise guarantee.
- The UI's whole-rupee display is deliberate for readability, but it must not be confused with a
  storage or transport representation.

## Backend decision

The Java boundary introduces `com.wapsi.backend.money.Money` as an integer-paise value object.
Conversions from `BigDecimal` require at most two decimal places. Arithmetic uses checked `long`
operations and requires the caller to supply a `RoundingMode` whenever multiplication can create
a fractional paise.

## Remaining correctness work

The TypeScript engine is the existing conformance reference for Workstream 2 C, but it is not yet
ported to paise. The Java engine must not be called equivalent until the golden-vector task is
complete. Until then, the known `TODO(verify)` rules and the TypeScript number representation
remain explicit limitations.

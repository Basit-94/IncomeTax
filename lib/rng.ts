/**
 * A deterministic pseudo-random generator, used so the prototype is
 * reproducible.
 *
 * `Math.random()` was the wrong tool here for two concrete reasons, neither of
 * them theoretical:
 *
 *   1. A reviewer who reloads the sandbox gets a different person, so a bug
 *      report and the attempt to reproduce it are talking about different data.
 *   2. The walkthrough video cannot be re-shot to match an earlier take.
 *
 * mulberry32 — small, fast, and good enough for picking a name out of a list.
 * Not for anything that needs to be unguessable; nothing here does.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Base seed for generated sandbox identities. Arbitrary, but fixed: the first
 * sandbox identity of a session is always the same person, so a reviewer's
 * screenshot and ours agree.
 */
export const SANDBOX_SEED = 0x77_61_70_73; // "waps"

/** Pick from a list. Never returns undefined for a non-empty list. */
export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

/** An integer in [min, max], both inclusive. */
export function intBetween(
  rand: () => number,
  min: number,
  max: number,
): number {
  return min + Math.floor(rand() * (max - min + 1));
}

/** An uppercase A–Z letter. */
export function letter(rand: () => number): string {
  return String.fromCharCode(65 + Math.floor(rand() * 26));
}

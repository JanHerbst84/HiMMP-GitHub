import "server-only";

/*
 * D-6 phase-1 — waveform height generator.
 *
 * `import "server-only"` guards this module against client-bundle
 * inclusion. Heights are computed during SSG (or in a server
 * component's render) and passed as a serialisable `number[]` to
 * the pure `<Waveform>` markup component. The FNV-1a + xorshift32
 * functions therefore never ship in the browser bundle.
 *
 * Determinism contract: identical `seed` input MUST produce
 * identical output. Math.imul + `>>> 0` are spec-exact in
 * ECMA-262 so the same Node.js / V8 builds the same arrays
 * across machines.
 */

const FNV_OFFSET_32 = 2166136261;
const FNV_PRIME_32 = 16777619;

function fnv1aHash(input: string): number {
  let hash = FNV_OFFSET_32;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME_32);
  }
  return hash >>> 0;
}

function xorshift32(state: number): number {
  let x = state;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

const MIN_PCT = 18;
const MAX_PCT = 92;

export function generateBarHeights(seed: string, count: number): number[] {
  let state = fnv1aHash(seed) || 1;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    state = xorshift32(state);
    // Divide by 2^32 (0x100000000) so `normalised ∈ [0, 1)` —
    // avoids the double-probability bin at the maximum that
    // dividing by 0xffffffff would create.
    const normalised = state / 0x100000000;
    const center = 0.5 + 0.42 * Math.sin((i / count) * Math.PI);
    const jitter = (normalised - 0.5) * 0.55;
    const value = Math.max(0, Math.min(1, center + jitter));
    heights.push(Math.round(MIN_PCT + (MAX_PCT - MIN_PCT) * value));
  }
  return heights;
}

// src/utils/simulation/rng.ts
// Seeded PRNG using Mulberry32 algorithm

/**
 * Mulberry32 — a fast 32-bit PRNG.
 * Returns a closure that produces numbers in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded RNG. Guards against seed=0 by substituting seed=1.
 */
export function createRng(seed: number): () => number {
  const safeSeed = seed === 0 ? 1 : Math.floor(seed);
  return mulberry32(safeSeed);
}

/**
 * Generate a random integer seed using Math.random().
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1;
}

/**
 * Unbiased random integer in [0, max) via rejection sampling over
 * crypto.getRandomValues. Used anywhere a tool needs real randomness
 * (Password Generator, Random Number Generator) — Math.random() is not a
 * CSPRNG, and a plain `% max` on a raw random value would introduce a
 * small modulo bias, which rejection sampling avoids.
 */
export function secureRandomInt(max: number): number {
  const range = 2 ** 32;
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

/** Inclusive random integer in [min, max]. */
export function secureRandomIntInRange(min: number, max: number): number {
  return min + secureRandomInt(max - min + 1);
}

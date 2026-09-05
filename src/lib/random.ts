/**
 * Unbiased random integer in [0, max) via rejection sampling over
 * crypto.getRandomValues. Used anywhere a tool needs real randomness
 * (Password Generator, Random Number Generator) — Math.random() is not a
 * CSPRNG, and a plain `% max` on a raw random value would introduce a
 * small modulo bias, which rejection sampling avoids.
 */
export function secureRandomInt(max: number): number {
  if (!Number.isFinite(max) || max <= 0 || max > 2 ** 32) {
    throw new RangeError(`secureRandomInt: max must be in (0, 2^32], got ${max}`);
  }
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
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new RangeError(`secureRandomIntInRange: require min <= max, got ${min}, ${max}`);
  }
  return min + secureRandomInt(max - min + 1);
}

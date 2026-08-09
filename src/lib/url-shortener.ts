import { secureRandomInt } from "@/lib/random";
import { getRedis } from "@/lib/redis";

/**
 * Mixed-case alphanumeric — cosmetically longer than the Stitch mockup's
 * 5-char example codes (`x7y9z`), but this is a real, publicly-writable
 * shortener rather than a static demo: 7 chars over a 62-symbol alphabet is
 * ~3.5 trillion combinations, which keeps collisions negligible without
 * needing to track total issued count.
 */
const CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const CODE_LENGTH = 7;
const MAX_GENERATION_ATTEMPTS = 5;
const REDIS_KEY_PREFIX = "url-shortener:";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[secureRandomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Parses and validates a candidate long URL. Returns the normalized URL
 * string, or null if it's not shortenable.
 *
 * `ownHost` guards against shortening a link that points back at this
 * site's own `/s/*` redirector — without it, a user could create a short
 * link whose target is itself (or a chain back to itself), which would
 * either loop forever or, at minimum, be a pointless/confusing link.
 */
export function normalizeLongUrl(input: string, ownHost: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.host === ownHost && parsed.pathname.startsWith("/s/")) return null;
  return parsed.toString();
}

/** Creates a new short code for `longUrl`, retrying on the (astronomically unlikely) key collision. */
export async function createShortLink(longUrl: string): Promise<string> {
  const redis = getRedis();
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateCode();
    // NX = only set if the key doesn't already exist — an atomic
    // collision-check-and-write in a single round trip, rather than a
    // separate GET-then-SET that could race with a concurrent request.
    const wasSet = await redis.set(`${REDIS_KEY_PREFIX}${code}`, longUrl, { nx: true });
    if (wasSet) return code;
  }
  throw new Error("Could not generate a unique short code — please try again.");
}

/** Looks up the long URL for a short code. Returns null if the code doesn't exist. */
export async function resolveShortLink(code: string): Promise<string | null> {
  const redis = getRedis();
  return redis.get<string>(`${REDIS_KEY_PREFIX}${code}`);
}

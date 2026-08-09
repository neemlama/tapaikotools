import { getRedis } from "@/lib/redis";

/**
 * 10 short-link creations per minute per IP. URL Shortener's `/api/shorten`
 * is the only publicly-writable endpoint on this site (every other tool is
 * client-only) — generous for real use, cheap insurance against a script
 * spamming the Redis quota with junk links.
 *
 * Hand-rolled fixed-window limiter — NOT `@upstash/ratelimit`. That package
 * was the original implementation, but every algorithm it offers (sliding
 * window, fixed window, token bucket) runs its logic as a Lua script via
 * EVAL/EVALSHA for atomicity, and Upstash's ACL system cannot grant
 * scripting permission to a restricted user at all — confirmed live while
 * setting up the dedicated `dailytools-url-shortener` ACL user: both
 * `+evalsha` (individual command) and `+@scripting` (category) were
 * rejected by Upstash's ACL parser with "unknown command or category name
 * in acl". Not a syntax mistake — a real platform limitation. This
 * implementation uses only INCRBY and PEXPIRE, both grantable, so the
 * entire app (shortening + rate limiting) can run under one
 * minimum-privilege credential with zero scripting access.
 *
 * Tradeoff, explicitly accepted: fixed-window (not sliding-window) means a
 * client can send up to ~2x the limit across a window boundary — e.g. 10
 * requests in the last second of one window, another 10 in the first
 * second of the next, since there's no weighting between windows. For
 * "cheap insurance against a spam script" on a low-traffic form, that's a
 * fine tradeoff for not needing scripting access at all.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const KEY_PREFIX = "url-shortener:ratelimit:";

export async function checkShortenRateLimit(identifier: string): Promise<{ success: boolean }> {
  const redis = getRedis();
  const windowBucket = Math.floor(Date.now() / WINDOW_MS);
  const key = `${KEY_PREFIX}${identifier}:${windowBucket}`;

  const count = await redis.incrby(key, 1);
  if (count === 1) {
    // First request to land in this window's bucket — set it to expire
    // with the window so old buckets clean themselves up. (A crash between
    // INCRBY and PEXPIRE could theoretically leave a key without a TTL;
    // worst case is one stale counter key lingering, not a security issue.)
    await redis.pexpire(key, WINDOW_MS);
  }
  return { success: count <= MAX_REQUESTS };
}

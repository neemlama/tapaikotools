import { getRedis } from "@/lib/redis";

/**
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
 * client can send up to ~2x a per-identifier limit across a window
 * boundary — e.g. N requests in the last second of one window, another N
 * in the first second of the next, since there's no weighting between
 * windows. Fine for "cheap insurance against a spam script," not a hard
 * guarantee.
 */
async function fixedWindowLimit(key: string, windowMs: number, maxRequests: number): Promise<{ success: boolean }> {
  const redis = getRedis();
  const count = await redis.incrby(key, 1);
  if (count === 1) {
    // First request to land in this window's bucket — set it to expire
    // with the window so old buckets clean themselves up. (A crash between
    // INCRBY and PEXPIRE could theoretically leave a key without a TTL;
    // worst case is one stale counter key lingering, not a security issue.)
    await redis.pexpire(key, windowMs);
  }
  return { success: count <= maxRequests };
}

/**
 * 10 short-link creations per minute per IP. `/api/shorten` is the only
 * publicly-writable endpoint on this site (every other tool is
 * client-only) — generous for real use, cheap insurance against a script
 * spamming the Redis quota with junk links.
 */
const CREATE_WINDOW_MS = 60_000;
const CREATE_MAX_REQUESTS = 10;

export async function checkShortenRateLimit(identifier: string): Promise<{ success: boolean }> {
  const windowBucket = Math.floor(Date.now() / CREATE_WINDOW_MS);
  const key = `url-shortener:ratelimit:create:${identifier}:${windowBucket}`;
  return fixedWindowLimit(key, CREATE_WINDOW_MS, CREATE_MAX_REQUESTS);
}

/**
 * 100 redirect follows per minute per IP on `/s/[code]`. Higher than the
 * create limit on purpose — following a link someone already shared is a
 * completely normal, high-frequency action (a popular link, or a whole
 * classroom/office clicking the same link from behind one shared IP), and
 * this exists only to blunt a scripted hammering of one redirect, not to
 * throttle real traffic.
 */
const REDIRECT_WINDOW_MS = 60_000;
const REDIRECT_MAX_REQUESTS = 100;

export async function checkRedirectRateLimit(identifier: string): Promise<{ success: boolean }> {
  const windowBucket = Math.floor(Date.now() / REDIRECT_WINDOW_MS);
  const key = `url-shortener:ratelimit:redirect:${identifier}:${windowBucket}`;
  return fixedWindowLimit(key, REDIRECT_WINDOW_MS, REDIRECT_MAX_REQUESTS);
}

/**
 * A global (site-wide, not per-IP) circuit breaker: at most 2,000 new short
 * links per UTC day, full stop. Per-IP limiting alone doesn't defend
 * against a *distributed* attacker (many IPs, each individually under the
 * per-IP cap) slowly running up Redis storage/request-quota costs — this
 * is the backstop for that case. 2,000/day is a starting guess for a
 * low-traffic personal tools site, not a measured number; raise it if
 * real usage ever gets close.
 */
const GLOBAL_DAILY_LIMIT = 2000;
// A little over 24h, so the key outlives its own UTC day even with clock/scheduling slack.
const GLOBAL_DAILY_KEY_TTL_MS = 26 * 60 * 60 * 1000;

export async function checkGlobalDailyLimit(): Promise<{ success: boolean }> {
  const redis = getRedis();
  const utcDay = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const key = `url-shortener:ratelimit:global:${utcDay}`;
  const count = await redis.incrby(key, 1);
  if (count === 1) {
    await redis.pexpire(key, GLOBAL_DAILY_KEY_TTL_MS);
  }
  return { success: count <= GLOBAL_DAILY_LIMIT };
}

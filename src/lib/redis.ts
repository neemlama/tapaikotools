import { Redis } from "@upstash/redis";

/**
 * Upstash's REST-based Redis client — a plain HTTPS request per call, no
 * persistent TCP connection/pool to manage — which is why it's the pick for
 * URL Shortener's storage (Phase 4, see docs/PLAN.md): this project has no
 * other backend infra, runs equally well from a Node or Edge route handler,
 * and needs no server of our own to run. See README for account setup.
 *
 * Throws clearly the first time something actually needs Redis (not at
 * import time), so a missing env var surfaces as an obvious message instead
 * of an opaque fetch failure deep inside the SDK — and doesn't affect any
 * other page, since nothing else on this site touches Redis.
 */
function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in your environment. " +
        "URL Shortener needs an Upstash Redis database to store short-link mappings — " +
        "see README.md for setup.",
    );
  }
  return new Redis({ url, token });
}

let cachedClient: Redis | null = null;

export function getRedis(): Redis {
  if (!cachedClient) cachedClient = createRedisClient();
  return cachedClient;
}

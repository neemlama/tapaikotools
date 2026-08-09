/**
 * The site's own absolute base URL — used for `metadataBase`, the sitemap,
 * and robots.txt. Set `NEXT_PUBLIC_SITE_URL` in your deploy host's
 * environment once you have a real domain; falls back to localhost for
 * local dev. Public (`NEXT_PUBLIC_`) on purpose — it's just this site's own
 * URL, not a secret, and metadata generation needs it available at build
 * time.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

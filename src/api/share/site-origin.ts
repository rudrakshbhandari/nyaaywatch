/**
 * Canonical site origin used for absolute URLs in OG meta tags, sitemaps, etc.
 * Reads CANONICAL_HOST from the environment when set, falls back to the
 * production domain.
 */
export const SITE_ORIGIN: string = process.env.CANONICAL_HOST
  ? `https://${process.env.CANONICAL_HOST}`
  : "https://nyaaywatch.in";

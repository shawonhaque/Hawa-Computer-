const DEPLOY_ORIGIN = "https://shawonhaque.github.io";

/**
 * Absolute origin for canonical URLs, sitemaps and Open Graph tags.
 *
 * The committed `.env` points NEXT_PUBLIC_SITE_URL at localhost for local dev,
 * and that value also leaks into static builds. Anything localhost is therefore
 * treated as unset and replaced with the real GitHub Pages origin plus the
 * export's route prefix.
 */
export function siteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const prefix = process.env.NEXT_PUBLIC_ROUTE_PREFIX ?? "";
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  return `${DEPLOY_ORIGIN}${prefix}`.replace(/\/$/, "");
}

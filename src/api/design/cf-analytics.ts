const CF_ANALYTICS_TOKEN = process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN;

/**
 * Cloudflare Web Analytics beacon. Emits nothing when the token isn't set
 * (local dev, pre-deploy). Gives visitor counts, page views, referrers,
 * and country breakdowns in the Cloudflare dashboard — no cookies.
 */
export function renderCfAnalyticsSnippet(): string {
  if (!CF_ANALYTICS_TOKEN) {
    return "";
  }

  return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${CF_ANALYTICS_TOKEN}"}'></script>`;
}

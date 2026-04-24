import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";

export function renderSubscribePage(context: PublicPageContext, opts?: { error?: string }): string {
  const body = `
    <section class="page-hero">
      <p class="page-hero__eyebrow">SUBSCRIBE</p>
      <h1 class="page-hero__hed">Get snapshot digests by email</h1>
      <p class="page-hero__lede">A plain-text email when a new NyaayWatch snapshot publishes — headline numbers, top flagged district, methodology notes. No marketing. Unsubscribe anytime.</p>
    </section>
    <section class="subscribe-form card" style="max-width:520px;margin-bottom:80px;">
      ${opts?.error ? `<p class="subscribe-form__error" role="alert">${escapeHtml(opts.error)}</p>` : ""}
      <form method="post" action="/subscribe">
        <input type="hidden" name="scope" value="${escapeHtml(context.profile.stateSlug)}" />
        <label class="subscribe-form__label" for="sub-email">Your email address</label>
        <input
          id="sub-email"
          type="email"
          name="email"
          required
          class="subscribe-form__input"
          placeholder="you@example.com"
          autocomplete="email"
        />
        <button type="submit" class="btn btn--primary" style="margin-top:16px;">Subscribe →</button>
        <p class="subscribe-form__note">We send a confirmation link first. Your email is stored securely and never shared. Unsubscribe anytime. <a href="${escapeHtml(context.routes.methodology)}">Methodology and privacy notes</a>.</p>
      </form>
    </section>
${SUBSCRIBE_CSS}
  `;

  return renderPageShell({
    title: "Subscribe — NyaayWatch",
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: "",
    footer: { sourceDateLabel: "", methodologyVersion: "", sourceAttribution: "" },
  });
}

export function renderSubscribeConfirmPending(email: string, context: PublicPageContext): string {
  const body = `
    <section class="page-hero">
      <p class="page-hero__eyebrow">CHECK YOUR INBOX</p>
      <h1 class="page-hero__hed">Confirmation sent.</h1>
      <p class="page-hero__lede">We sent a confirmation link to <strong>${escapeHtml(email)}</strong>. Click it to activate your subscription.</p>
    </section>
    <p style="margin-bottom:80px;color:var(--ink-soft)">Didn't receive it? Check your spam folder. The link expires after 7 days.</p>
  `;

  return renderPageShell({
    title: "Confirm your subscription — NyaayWatch",
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: "",
    footer: { sourceDateLabel: "", methodologyVersion: "", sourceAttribution: "" },
  });
}

export function renderSubscribeConfirmed(context: PublicPageContext): string {
  const body = `
    <section class="page-hero">
      <p class="page-hero__eyebrow">YOU'RE IN</p>
      <h1 class="page-hero__hed">Subscription confirmed.</h1>
      <p class="page-hero__lede">You'll receive a plain-text digest whenever a new snapshot publishes. <a href="${escapeHtml(context.routes.home)}">Return to the homepage.</a></p>
    </section>
  `;

  return renderPageShell({
    title: "Subscribed — NyaayWatch",
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: "",
    footer: { sourceDateLabel: "", methodologyVersion: "", sourceAttribution: "" },
  });
}

export function renderSubscribeAlreadyConfirmed(context: PublicPageContext): string {
  const body = `
    <section class="page-hero">
      <p class="page-hero__eyebrow">ALREADY CONFIRMED</p>
      <h1 class="page-hero__hed">You're already subscribed.</h1>
      <p class="page-hero__lede"><a href="${escapeHtml(context.routes.home)}">Return to the homepage.</a></p>
    </section>
  `;

  return renderPageShell({
    title: "Already subscribed — NyaayWatch",
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: "",
    footer: { sourceDateLabel: "", methodologyVersion: "", sourceAttribution: "" },
  });
}

export function renderUnsubscribed(context: PublicPageContext): string {
  const body = `
    <section class="page-hero">
      <p class="page-hero__eyebrow">UNSUBSCRIBED</p>
      <h1 class="page-hero__hed">You've been removed.</h1>
      <p class="page-hero__lede">You won't receive any more NyaayWatch digests. <a href="${escapeHtml(context.routes.home)}">Return to the homepage.</a></p>
    </section>
  `;

  return renderPageShell({
    title: "Unsubscribed — NyaayWatch",
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: "",
    footer: { sourceDateLabel: "", methodologyVersion: "", sourceAttribution: "" },
  });
}

const SUBSCRIBE_CSS = `<style>
.subscribe-form { padding: 32px; }
.subscribe-form__label {
  display: block;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--ink-muted);
  margin-bottom: 8px;
}
.subscribe-form__input {
  display: block; width: 100%;
  font-family: "Inter Tight", sans-serif;
  font-size: 16px; font-weight: 500;
  padding: 10px 12px;
  border: 1px solid var(--rule);
  background: var(--paper);
  color: var(--ink);
  border-radius: 2px;
}
.subscribe-form__input:focus {
  outline: none;
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.subscribe-form__note {
  margin-top: 12px;
  font-size: 13px; color: var(--ink-muted);
}
.subscribe-form__error {
  color: var(--accent);
  font-size: 14px; font-weight: 600;
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid var(--accent);
}
</style>`;

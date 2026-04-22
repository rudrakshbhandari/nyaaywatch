import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml } from "../../lib/html.js";

export interface WaitingRoomRates {
  /**
   * Cases filed in an average hour at the snapshot's implied rate. We
   * derive hourly rates rather than per-second because for low-volume
   * states the per-second number is a tiny fraction; over the ~8s intro
   * window it rounded to zero ("0 new cases filed"), which read as a bug.
   * Hourly units produce honest, non-zero integers for every state.
   */
  filedPerHour: number;
  decidedPerHour: number;
  /** filedPerHour − decidedPerHour. May be negative (clearance > filing). */
  netPerHour: number;
  stateName: string;
}

export function computeWaitingRoomRates(snapshot: PublishedSnapshot): WaitingRoomRates {
  const { pendingCases, disposalRate, medianCaseAgeDays } = snapshot.stats;
  const medianWaitMonths = Math.max(medianCaseAgeDays / 30, 1);
  const disposalRateFraction = disposalRate / 100;
  const hoursPerMonth = 30 * 24;

  const decidedPerMonth = pendingCases / medianWaitMonths;
  const filedPerMonth =
    disposalRateFraction > 0 ? decidedPerMonth / disposalRateFraction : decidedPerMonth;

  return {
    filedPerHour: filedPerMonth / hoursPerMonth,
    decidedPerHour: decidedPerMonth / hoursPerMonth,
    netPerHour: (filedPerMonth - decidedPerMonth) / hoursPerMonth,
    stateName: snapshot.snapshot.stateName,
  };
}

/**
 * Returns an HTML fragment — a full-viewport overlay that shows on first visit
 * (no cookie present) and hides itself after ~6 s or on Skip. Sets a session
 * cookie so returning visitors never see it again.
 *
 * Respects prefers-reduced-motion: shows static text, no counter, no fade.
 */
export function renderWaitingRoom(rates: WaitingRoomRates): string {
  const { filedPerHour, decidedPerHour, netPerHour, stateName } = rates;
  const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
  const filedDisplay = fmt(filedPerHour);
  const decidedDisplay = fmt(decidedPerHour);
  // If decidedPerHour > filedPerHour the pile shrunk — rare, but don't
  // assert a positive growth number in that case.
  const netIsPositive = netPerHour >= 0;
  const netDisplay = netIsPositive ? `+${fmt(netPerHour)}` : `−${fmt(Math.abs(netPerHour))}`;

  return `
<div id="wr" class="wr" aria-live="polite" role="dialog" aria-modal="true" aria-label="The Waiting Room">
  <div class="wr__inner">
    <p class="wr__eyebrow">THE WAITING ROOM</p>
    <p class="wr__line wr__line--1" id="wr-l1">In ${escapeHtml(stateName)}, the courts are open.</p>
    <p class="wr__line wr__line--2" id="wr-l2">Every hour at current rates: <strong>${escapeHtml(filedDisplay)} new cases filed</strong>.</p>
    <p class="wr__line wr__line--3" id="wr-l3"><strong>${escapeHtml(decidedDisplay)} decided</strong>. The pile ${netIsPositive ? "grows" : "shrinks"} by <strong>${escapeHtml(netDisplay)}</strong>.</p>
    <p class="wr__line wr__line--4" id="wr-l4">This is the backlog. It is not an abstraction.</p>
    <button class="wr__skip" id="wr-skip" aria-label="Skip intro">Skip →</button>
  </div>
</div>
<style>
.wr {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--paper);
  display: flex; align-items: center; justify-content: flex-start;
  padding: 0 10vw;
  opacity: 1;
  transition: opacity 0.6s ease;
}
.wr.wr--hidden { opacity: 0; pointer-events: none; }
.wr__inner { max-width: 640px; }
.wr__eyebrow {
  margin: 0 0 36px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.18em;
  color: var(--ink-muted);
}
.wr__line {
  margin: 0 0 20px;
  font-size: clamp(22px, 3.6vw, 38px);
  line-height: 1.2;
  letter-spacing: -0.025em;
  font-weight: 500;
  color: var(--ink);
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity 0.5s ease, transform 0.5s ease, visibility 0s 0.5s;
}
.wr__line--visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity 0.5s ease, transform 0.5s ease, visibility 0s;
}
.wr__line strong { font-weight: 900; }
.wr__skip {
  margin-top: 40px;
  background: none; border: 1px solid var(--rule);
  padding: 8px 18px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 12px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink-muted); cursor: pointer;
  opacity: 0; visibility: hidden;
  transition: opacity 0.4s ease 1s, background 120ms, visibility 0s 1s;
}
.wr__skip:hover { background: var(--rule); color: var(--ink); }
.wr__skip--visible { opacity: 1; visibility: visible; transition: opacity 0.4s ease, background 120ms, visibility 0s; }
@media (prefers-reduced-motion: reduce) {
  .wr__line, .wr__skip {
    opacity: 1 !important; visibility: visible !important;
    transform: none !important; transition: none !important;
  }
  .wr { transition: none !important; }
}
</style>
<script>
(function() {
  // Rates are now rendered server-side (static per-hour values) so this script
  // only handles the dismiss cookie, the line-by-line fade-in, and the Skip
  // button. The earlier version ran a per-second ticker starting at zero —
  // honest math, but for low-volume states the integers stayed at 0 across
  // the entire intro window, which read as a broken UI. Per-hour is always
  // non-zero and answers "what does this surface mean" in one glance.
  var COOKIE = "nw_seen_intro";
  function hasCookie() {
    return document.cookie.split(";").some(function(c) { return c.trim().startsWith(COOKIE + "="); });
  }
  function setCookie() {
    document.cookie = COOKIE + "=1; path=/; max-age=31536000; SameSite=Lax";
  }
  var wr = document.getElementById("wr");
  if (!wr) return;
  if (hasCookie()) { wr.style.display = "none"; return; }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var skipBtn = document.getElementById("wr-skip");

  function dismiss() {
    setCookie();
    wr.classList.add("wr--hidden");
    setTimeout(function() { wr.style.display = "none"; document.body.style.overflow = ""; }, 650);
  }

  skipBtn && skipBtn.addEventListener("click", dismiss);

  document.body.style.overflow = "hidden";

  if (reducedMotion) {
    if (skipBtn) skipBtn.classList.add("wr__skip--visible");
    setTimeout(dismiss, 5000);
    return;
  }

  var lines = [
    { el: document.getElementById("wr-l1"), delay: 200 },
    { el: document.getElementById("wr-l2"), delay: 1600 },
    { el: document.getElementById("wr-l3"), delay: 3000 },
    { el: document.getElementById("wr-l4"), delay: 4400 },
  ];
  lines.forEach(function(item) {
    if (!item.el) return;
    setTimeout(function() { item.el.classList.add("wr__line--visible"); }, item.delay);
  });
  setTimeout(function() { if (skipBtn) skipBtn.classList.add("wr__skip--visible"); }, 2000);

  setTimeout(dismiss, 8000);
})();
</script>
`;
}

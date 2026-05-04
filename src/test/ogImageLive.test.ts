import { describe, it, expect } from "vitest";

/**
 * Live check: the production OG image must be reachable as image/png.
 * Skipped by default; run with `OG_LIVE_CHECK=1 bunx vitest run src/test/ogImageLive.test.ts`
 * (or in CI when network egress is available).
 *
 * ──────────────────────────────────────────────────────────────────
 * EXPECTED CANONICAL REDIRECT BEHAVIOR (validated 2026-05-04)
 * ──────────────────────────────────────────────────────────────────
 *  Request:  HEAD https://www.comparewaterfilters.com.au/og-default.png
 *    → 302  Location: https://comparewaterfilters.com.au/og-default.png
 *  Request:  HEAD https://comparewaterfilters.com.au/og-default.png
 *    → 200  content-type: image/png
 *
 *  This single canonical hop (www → apex) is INTENTIONAL and served by
 *  Cloudflare. Apex is the primary domain in Lovable's domain settings;
 *  `www` is configured to redirect to it. OG/Twitter crawlers, Slack,
 *  iMessage, LinkedIn, Discord, and Facebook all follow 3xx redirects
 *  on og:image URLs, so this has zero impact on social previews.
 *
 *  CI must therefore NOT fail when the first hop is a same-domain
 *  redirect to the apex og-default.png. It should only fail if:
 *    • the redirect leaves the comparewaterfilters.com.au domain, OR
 *    • the final hop is not 200 image/png, OR
 *    • there are multiple redirect hops (sign of a misconfiguration).
 * ──────────────────────────────────────────────────────────────────
 */
const OG_URL = "https://www.comparewaterfilters.com.au/og-default.png";
const APEX_URL = "https://comparewaterfilters.com.au/og-default.png";
const ENABLED = process.env.OG_LIVE_CHECK === "1";

describe.skipIf(!ENABLED)("OG image live availability", () => {
  it(`${OG_URL} returns HTTP 200`, async () => {
    const res = await fetch(OG_URL, { method: "HEAD", redirect: "follow" });
    expect(res.status, `Expected 200, got ${res.status}`).toBe(200);
  });

  it(`${OG_URL} serves content-type image/png`, async () => {
    const res = await fetch(OG_URL, { method: "HEAD", redirect: "follow" });
    const ct = res.headers.get("content-type") ?? "";
    expect(ct.toLowerCase(), `Unexpected content-type: ${ct}`).toContain("image/png");
  });

  it(`${OG_URL} canonical chain is at most one same-domain hop ending in 200 image/png`, async () => {
    // Hop 1
    const first = await fetch(OG_URL, { method: "HEAD", redirect: "manual" });
    if (first.status === 200) {
      // No redirect at all — also acceptable.
      expect(first.headers.get("content-type")?.toLowerCase()).toContain("image/png");
      return;
    }
    // Must be a redirect.
    expect(first.status, `First hop must be 200 or 3xx, got ${first.status}`).toBeGreaterThanOrEqual(300);
    expect(first.status).toBeLessThan(400);
    const loc = first.headers.get("location") ?? "";
    expect(loc, `Redirect must stay on comparewaterfilters.com.au, got ${loc}`).toMatch(
      /^https:\/\/(www\.)?comparewaterfilters\.com\.au\/og-default\.png$/,
    );

    // Hop 2 — must be terminal.
    const second = await fetch(loc, { method: "HEAD", redirect: "manual" });
    expect(second.status, `Second hop must be terminal 200, got ${second.status}`).toBe(200);
    expect(second.headers.get("content-type")?.toLowerCase()).toContain("image/png");
  });

  it(`${APEX_URL} (canonical apex) serves 200 image/png with no redirect`, async () => {
    const res = await fetch(APEX_URL, { method: "HEAD", redirect: "manual" });
    expect(res.status, `Apex must serve 200 directly, got ${res.status}`).toBe(200);
    expect(res.headers.get("content-type")?.toLowerCase()).toContain("image/png");
  });
});
import { describe, it, expect } from "vitest";

/**
 * Live check: the production OG image must be reachable as image/png.
 * Skipped by default; run with `OG_LIVE_CHECK=1 bunx vitest run src/test/ogImageLive.test.ts`
 * (or in CI when network egress is available).
 */
const OG_URL = "https://www.comparewaterfilters.com.au/og-default.png";
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
});
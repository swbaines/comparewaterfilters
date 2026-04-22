import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { articles } from "@/data/articles";

/**
 * Breadcrumb URL canonicalization + reachability checks.
 *
 * For every JSON-LD BreadcrumbList in our marketing pages we assert:
 *   1. Each `item` URL uses the canonical host
 *      `https://www.comparewaterfilters.com.au` (no `http`, no apex domain,
 *      no `comparewaterfilters.au` aliases) — matches our canonical tag and
 *      `CanonicalDomainGuard`.
 *   2. Each `item` path matches the route the page is mounted at.
 *   3. (Live) Each URL responds 200. Skipped by default — opt in with
 *      `RUN_LIVE_BREADCRUMB_CHECK=1` to avoid flaky CI runs against the
 *      published site. When enabled, requests time out at 10s.
 */

const CANONICAL_HOST = "https://www.comparewaterfilters.com.au";

interface PageSpec {
  file: string;
  /** Expected canonical paths in breadcrumb order. Empty string = root "/". */
  paths: string[];
}

const STATIC_PAGES: PageSpec[] = [
  { file: "src/pages/AboutPage.tsx", paths: ["", "/about"] },
  { file: "src/pages/ContactPage.tsx", paths: ["", "/contact"] },
  { file: "src/pages/HowItWorksPage.tsx", paths: ["", "/how-it-works"] },
  { file: "src/pages/LearnPage.tsx", paths: ["", "/learn"] },
  { file: "src/pages/PricingGuidePage.tsx", paths: ["", "/pricing-guide"] },
  { file: "src/pages/SystemTypesPage.tsx", paths: ["", "/system-types"] },
  { file: "src/pages/WaterQualityPage.tsx", paths: ["", "/water-quality"] },
];

function read(file: string): string {
  return readFileSync(resolve(process.cwd(), file), "utf8");
}

function extractBreadcrumbItemUrls(src: string): string[] {
  const start = src.indexOf("BreadcrumbList");
  if (start === -1) return [];
  const arrStart = src.indexOf("itemListElement", start);
  const open = src.indexOf("[", arrStart);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = src.slice(open, end + 1);
  const urls: string[] = [];
  // Capture the value of `item:` — handles "literal", `template`, or identifier.
  const itemRe = /item\s*:\s*("([^"]+)"|`([^`]+)`|([A-Za-z_$][\w$]*))/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(block)) !== null) {
    if (m[2] !== undefined) urls.push(m[2]);
    else if (m[3] !== undefined) {
      // Resolve `${BASE_URL}` template substitution against canonical host.
      urls.push(m[3].replace(/\$\{BASE_URL\}/g, CANONICAL_HOST));
    } else if (m[4] !== undefined) {
      // Bare identifier like `BASE_URL` — substitute too.
      urls.push(m[4] === "BASE_URL" ? CANONICAL_HOST : `<${m[4]}>`);
    }
  }
  return urls;
}

/** Normalise canonical: strip trailing slash UNLESS path is just "/". */
function normalise(url: string): { host: string; path: string } {
  const u = new URL(url);
  let path = u.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return { host: `${u.protocol}//${u.host}`, path };
}

describe("Breadcrumb item URLs use the canonical host + path", () => {
  for (const page of STATIC_PAGES) {
    describe(page.file, () => {
      const src = read(page.file);
      const urls = extractBreadcrumbItemUrls(src);

      it("emits one URL per expected breadcrumb position", () => {
        expect(urls.length).toBe(page.paths.length);
      });

      it("every URL uses the canonical host (https://www.comparewaterfilters.com.au)", () => {
        for (const u of urls) {
          const { host } = normalise(u);
          expect(host, `Non-canonical host in ${page.file}: ${u}`).toBe(
            CANONICAL_HOST,
          );
        }
      });

      it("paths match the expected route order", () => {
        const got = urls.map((u) => normalise(u).path).map((p) =>
          p === "/" ? "" : p,
        );
        expect(got).toEqual(page.paths);
      });
    });
  }

  describe("src/pages/ArticlePage.tsx (dynamic)", () => {
    const src = read("src/pages/ArticlePage.tsx");
    const urls = extractBreadcrumbItemUrls(src);

    it("emits Home, /learn, and /learn/<slug> in order", () => {
      expect(urls.length).toBe(3);
      expect(normalise(urls[0])).toEqual({ host: CANONICAL_HOST, path: "/" });
      expect(normalise(urls[1])).toEqual({ host: CANONICAL_HOST, path: "/learn" });
      // Position 3 is `${BASE_URL}/learn/${article.slug}` → after substitution
      // we get a literal `/learn/${article.slug}` fragment we cannot resolve
      // statically. Just check the prefix.
      expect(urls[2]).toMatch(
        new RegExp(`^${CANONICAL_HOST.replace(/\./g, "\\.")}/learn/`),
      );
    });
  });
});

/* -------------------------------------------------------------------------- */
/*  Live reachability: opt-in with RUN_LIVE_BREADCRUMB_CHECK=1                */
/* -------------------------------------------------------------------------- */

const LIVE = process.env.RUN_LIVE_BREADCRUMB_CHECK === "1";

describe.runIf(LIVE)("Breadcrumb URLs resolve (HTTP 200) on the live site", () => {
  const allUrls = new Set<string>();

  // Static page crumbs
  for (const page of STATIC_PAGES) {
    for (const p of page.paths) {
      allUrls.add(`${CANONICAL_HOST}${p === "" ? "/" : p}`);
    }
  }
  // ArticlePage dynamic crumbs — expand against real article slugs.
  allUrls.add(`${CANONICAL_HOST}/`);
  allUrls.add(`${CANONICAL_HOST}/learn`);
  for (const a of articles) {
    allUrls.add(`${CANONICAL_HOST}/learn/${a.slug}`);
  }

  for (const url of allUrls) {
    it(`GET ${url} → 200`, async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      try {
        // Use GET (not HEAD) — some CDNs return 405 for HEAD on SPA routes.
        const res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: ctrl.signal,
          headers: { "user-agent": "breadcrumb-url-check" },
        });
        expect(res.status, `Unexpected status for ${url}`).toBe(200);
      } finally {
        clearTimeout(t);
      }
    }, 15_000);
  }
});
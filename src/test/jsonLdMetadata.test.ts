import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * JSON-LD structured-data regression.
 *
 * `index.html` ships global Organization + WebSite blocks that apply to
 * every route. Individual marketing pages add page-specific @types
 * (BreadcrumbList, FAQPage, HowTo, Article, AboutPage, …).
 *
 * This test extracts the @type strings statically from each page's source
 * (no rendering) and asserts the required schema.org types are declared.
 */

interface RouteJsonLdSpec {
  route: string;
  file: string;
  /** @types that MUST appear in this page's structured data. */
  requiredTypes: string[];
  /**
   * When true, the page must declare @type "FAQPage" because it renders
   * a visible FAQ accordion (Google requires schema parity with UI).
   */
  hasFaq: boolean;
}

const ROUTES: RouteJsonLdSpec[] = [
  {
    route: "/",
    file: "src/pages/HomePage.tsx",
    requiredTypes: ["WebSite", "Organization", "FAQPage", "Question", "Answer"],
    hasFaq: true,
  },
  {
    route: "/about",
    file: "src/pages/AboutPage.tsx",
    requiredTypes: ["AboutPage", "Organization", "BreadcrumbList", "ListItem"],
    hasFaq: false,
  },
  {
    route: "/contact",
    file: "src/pages/ContactPage.tsx",
    requiredTypes: ["BreadcrumbList", "ListItem"],
    hasFaq: false,
  },
  {
    route: "/system-types",
    file: "src/pages/SystemTypesPage.tsx",
    requiredTypes: ["WebPage", "BreadcrumbList", "FAQPage", "Question", "Answer"],
    hasFaq: true,
  },
  {
    route: "/pricing-guide",
    file: "src/pages/PricingGuidePage.tsx",
    requiredTypes: ["WebPage", "BreadcrumbList", "FAQPage", "Question", "Answer"],
    hasFaq: true,
  },
  {
    route: "/learn",
    file: "src/pages/LearnPage.tsx",
    requiredTypes: ["BreadcrumbList", "ListItem"],
    hasFaq: false,
  },
  {
    route: "/learn/:slug",
    file: "src/pages/ArticlePage.tsx",
    requiredTypes: ["Article", "BreadcrumbList", "ListItem"],
    hasFaq: false,
  },
  {
    route: "/how-it-works",
    file: "src/pages/HowItWorksPage.tsx",
    requiredTypes: ["HowTo", "HowToStep", "BreadcrumbList"],
    hasFaq: false,
  },
  {
    route: "/water-quality",
    file: "src/pages/WaterQualityPage.tsx",
    requiredTypes: ["FAQPage", "Question", "Answer", "BreadcrumbList"],
    hasFaq: true,
  },
];

function read(filePath: string): string {
  return readFileSync(resolve(process.cwd(), filePath), "utf8");
}

/** Extract every "@type": "X" literal from a TSX source file. */
function extractTypes(src: string): Set<string> {
  const types = new Set<string>();
  const re = /"@type"\s*:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) types.add(m[1]);
  return types;
}

describe("JSON-LD structured data regression", () => {
  describe("Global (index.html)", () => {
    const html = read("index.html");
    const types = extractTypes(html);

    it("declares Organization for every route", () => {
      expect(types.has("Organization")).toBe(true);
    });

    it("declares WebSite for every route", () => {
      expect(types.has("WebSite")).toBe(true);
    });

    it("contains at least two application/ld+json script blocks", () => {
      const matches = html.match(/<script\s+type=["']application\/ld\+json["']/g) ?? [];
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  for (const spec of ROUTES) {
    describe(`${spec.route} (${spec.file})`, () => {
      const src = read(spec.file);
      const types = extractTypes(src);

      it("emits at least one JSON-LD @type", () => {
        expect(types.size, `No @type declarations found in ${spec.file}`)
          .toBeGreaterThan(0);
      });

      for (const required of spec.requiredTypes) {
        it(`declares @type "${required}"`, () => {
          expect(
            types.has(required),
            `Missing required @type "${required}" in ${spec.file}. Found: [${[...types].join(", ")}]`,
          ).toBe(true);
        });
      }

      it("uses schema.org @context", () => {
        expect(/"@context"\s*:\s*"https:\/\/schema\.org"/.test(src)).toBe(true);
      });

      if (spec.hasFaq) {
        it("FAQ schema is wired through mainEntity (parity with visible accordion)", () => {
          expect(/mainEntity/.test(src), `FAQ page missing mainEntity in ${spec.file}`)
            .toBe(true);
        });
      }

      it("injects structured data into <head> at runtime", () => {
        const wired =
          /document\.head\.appendChild\(\s*script\s*\)/.test(src) ||
          /createElement\(["']script["']\)/.test(src);
        expect(wired, `${spec.file} should append a JSON-LD <script> to <head>`)
          .toBe(true);
      });
    });
  }
});

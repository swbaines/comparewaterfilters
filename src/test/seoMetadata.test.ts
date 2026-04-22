import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * SEO regression: public marketing routes must lead with "whole house"
 * as the primary keyword. "Whole home" is allowed only inside the
 * description (as a secondary search variant), and must never appear
 * in the title.
 *
 * Transactional/admin/vendor routes are exempt because they are
 * non-indexed utility pages.
 */

interface RouteMeta {
  route: string;
  file: string;
  /** When true, title MUST start with "Whole House" (case-insensitive). */
  enforcePrimaryKeyword: boolean;
}

const PUBLIC_MARKETING_ROUTES: RouteMeta[] = [
  { route: "/", file: "src/pages/HomePage.tsx", enforcePrimaryKeyword: true },
  { route: "/system-types", file: "src/pages/SystemTypesPage.tsx", enforcePrimaryKeyword: true },
  { route: "/pricing-guide", file: "src/pages/PricingGuidePage.tsx", enforcePrimaryKeyword: true },
  { route: "/learn", file: "src/pages/LearnPage.tsx", enforcePrimaryKeyword: true },
  { route: "/how-it-works", file: "src/pages/HowItWorksPage.tsx", enforcePrimaryKeyword: true },
  { route: "/water-quality", file: "src/pages/WaterQualityPage.tsx", enforcePrimaryKeyword: false },
  { route: "/about", file: "src/pages/AboutPage.tsx", enforcePrimaryKeyword: false },
  { route: "/contact", file: "src/pages/ContactPage.tsx", enforcePrimaryKeyword: false },
  { route: "/quiz", file: "src/pages/QuizPage.tsx", enforcePrimaryKeyword: true },
  { route: "/provider-match", file: "src/pages/ProviderMatchPage.tsx", enforcePrimaryKeyword: true },
];

interface ExtractedMeta {
  title: string;
  description: string;
}

function extractPageMeta(filePath: string): ExtractedMeta {
  const src = readFileSync(resolve(process.cwd(), filePath), "utf8");
  const block = src.match(/<PageMeta\b[\s\S]*?\/>/);
  if (!block) throw new Error(`No <PageMeta /> found in ${filePath}`);
  const titleMatch = block[0].match(/title="([^"]+)"/);
  const descMatch = block[0].match(/description="([^"]+)"/);
  if (!titleMatch || !descMatch) {
    throw new Error(`Missing title/description in ${filePath}`);
  }
  return { title: titleMatch[1], description: descMatch[1] };
}

describe("SEO metadata regression", () => {
  for (const r of PUBLIC_MARKETING_ROUTES) {
    describe(`${r.route} (${r.file})`, () => {
      const meta = extractPageMeta(r.file);

      it("title never contains 'whole home' (must use 'whole house')", () => {
        expect(
          /whole[\s-]home/i.test(meta.title),
          `Title contains 'whole home': "${meta.title}"`,
        ).toBe(false);
      });

      if (r.enforcePrimaryKeyword) {
        it("title leads with the 'whole house' primary keyword", () => {
          expect(
            /whole\s+house/i.test(meta.title),
            `Title must include 'whole house': "${meta.title}"`,
          ).toBe(true);
        });
      }

      it("title is ≤ 65 characters", () => {
        expect(meta.title.length, `Title is ${meta.title.length} chars: "${meta.title}"`)
          .toBeLessThanOrEqual(65);
      });

      it("description is ≤ 165 characters", () => {
        expect(
          meta.description.length,
          `Description is ${meta.description.length} chars`,
        ).toBeLessThanOrEqual(165);
      });

      it("description either omits 'whole home' or pairs it with 'whole house' (secondary phrasing only)", () => {
        const hasHome = /whole[\s-]home/i.test(meta.description);
        const hasHouse = /whole\s+house/i.test(meta.description);
        if (hasHome) {
          expect(
            hasHouse,
            `Description mentions 'whole home' without the primary 'whole house' keyword: "${meta.description}"`,
          ).toBe(true);
        }
      });
    });
  }

  it("index.html <title> uses 'whole house' as primary and never just 'whole home'", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
    expect(titleMatch, "index.html must have a <title>").toBeTruthy();
    const title = titleMatch![1];
    expect(/whole\s+house/i.test(title), `index.html title missing 'whole house': ${title}`).toBe(true);
    expect(
      /whole[\s-]home/i.test(title),
      `index.html title still references 'whole home': ${title}`,
    ).toBe(false);
  });
});

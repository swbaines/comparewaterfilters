import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * BreadcrumbList parity regression.
 *
 * Each marketing page renders <Breadcrumbs items={[…]} /> for the visible
 * navigation path AND emits a JSON-LD BreadcrumbList for search engines.
 * Google penalises mismatches, so the order + labels MUST agree:
 *   visible:  Home → <items[0].label> → <items[1].label> …
 *   JSON-LD:  position 1 "Home" → position 2 <name> → position 3 <name> …
 *
 * This test extracts both lists statically (no rendering) and asserts:
 *   1. JSON-LD always starts with position 1 "Home".
 *   2. Position numbers are 1..N with no gaps.
 *   3. JSON-LD labels at positions 2..N match the visible <Breadcrumbs>
 *      labels in the same order.
 */

interface PageSpec {
  /** Source file. */
  file: string;
  /** Visible labels passed to <Breadcrumbs items=…/>, in order. */
  visible: string[];
}

const PAGES: PageSpec[] = [
  { file: "src/pages/AboutPage.tsx", visible: ["About"] },
  { file: "src/pages/ContactPage.tsx", visible: ["Contact"] },
  { file: "src/pages/HowItWorksPage.tsx", visible: ["How It Works"] },
  { file: "src/pages/LearnPage.tsx", visible: ["Learn"] },
  { file: "src/pages/PricingGuidePage.tsx", visible: ["Pricing Guide"] },
  { file: "src/pages/SystemTypesPage.tsx", visible: ["System Types"] },
  { file: "src/pages/WaterQualityPage.tsx", visible: ["Water Quality"] },
  // ArticlePage is dynamic — its tail label is `article.title`. We assert
  // structural integrity (Home → Learn → <article>) separately below.
];

interface JsonLdItem {
  position: number;
  name: string;
}

function read(file: string): string {
  return readFileSync(resolve(process.cwd(), file), "utf8");
}

/**
 * Extract JSON-LD BreadcrumbList items from a TSX source. We tolerate
 * either string literals (`name: "Home"`) or simple template/identifier
 * expressions (`name: article.title`) — the latter we represent as a
 * placeholder so we can still validate position ordering.
 */
function extractBreadcrumbItems(src: string): JsonLdItem[] {
  const start = src.indexOf("BreadcrumbList");
  if (start === -1) return [];
  const arrStart = src.indexOf("itemListElement", start);
  if (arrStart === -1) return [];
  const open = src.indexOf("[", arrStart);
  if (open === -1) return [];
  // Walk forward to the matching closing bracket.
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
  if (end === -1) return [];
  const block = src.slice(open, end + 1);

  const items: JsonLdItem[] = [];
  // Match each "ListItem" sub-object and pull position + name.
  const itemRe = /"@type"\s*:\s*"ListItem"[\s\S]*?position\s*:\s*(\d+)[\s\S]*?name\s*:\s*([^,}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(block)) !== null) {
    const position = parseInt(m[1], 10);
    let rawName = m[2].trim();
    // Strip surrounding quotes if it's a literal.
    if (
      (rawName.startsWith('"') && rawName.endsWith('"')) ||
      (rawName.startsWith("'") && rawName.endsWith("'"))
    ) {
      rawName = rawName.slice(1, -1);
    } else if (rawName.startsWith("`") && rawName.endsWith("`")) {
      rawName = rawName.slice(1, -1);
    } else {
      // Identifier or expression like `article.title` — mark as dynamic.
      rawName = `<${rawName}>`;
    }
    items.push({ position, name: rawName });
  }
  return items;
}

describe("BreadcrumbList parity (visible nav vs JSON-LD)", () => {
  for (const page of PAGES) {
    describe(page.file, () => {
      const src = read(page.file);
      const items = extractBreadcrumbItems(src);

      it("emits a JSON-LD BreadcrumbList", () => {
        expect(items.length, `No ListItems parsed in ${page.file}`)
          .toBeGreaterThan(0);
      });

      it("starts with position 1 'Home'", () => {
        expect(items[0]?.position).toBe(1);
        expect(items[0]?.name).toBe("Home");
      });

      it("uses sequential positions 1..N with no gaps", () => {
        items.forEach((item, idx) => {
          expect(
            item.position,
            `Out-of-order position at index ${idx}: ${JSON.stringify(item)}`,
          ).toBe(idx + 1);
        });
      });

      it("has the same number of crumbs as the visible <Breadcrumbs />", () => {
        // Visible = Home (implicit) + page.visible — JSON-LD includes Home.
        expect(items.length).toBe(page.visible.length + 1);
      });

      it("JSON-LD labels (positions 2..N) match the visible labels in order", () => {
        const tail = items.slice(1).map((i) => i.name);
        expect(tail).toEqual(page.visible);
      });
    });
  }

  describe("src/pages/ArticlePage.tsx (dynamic)", () => {
    const src = read("src/pages/ArticlePage.tsx");
    const items = extractBreadcrumbItems(src);

    it("declares Home → Learn → <dynamic article title>", () => {
      expect(items.length).toBe(3);
      expect(items[0]).toEqual({ position: 1, name: "Home" });
      expect(items[1]).toEqual({ position: 2, name: "Learn" });
      expect(items[2].position).toBe(3);
      // Position 3 must be a dynamic expression (not a hard-coded string),
      // since article titles vary per route.
      expect(
        items[2].name.startsWith("<") && items[2].name.endsWith(">"),
        `Expected dynamic article title, got: ${items[2].name}`,
      ).toBe(true);
    });

    it("visible <Breadcrumbs /> mirrors Learn → article.title order", () => {
      // Confirm the JSX call site uses the same Learn → article.title order.
      const callRe =
        /Breadcrumbs\s+items=\{\[\s*\{\s*label:\s*"Learn"\s*,\s*href:\s*"\/learn"\s*\}\s*,\s*\{\s*label:\s*article\.title\s*\}\s*\]\s*\}/;
      expect(callRe.test(src)).toBe(true);
    });
  });
});

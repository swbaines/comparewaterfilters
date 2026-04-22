import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * JSON-LD BreadcrumbList schema conformance.
 *
 * Validates that every page rendering a BreadcrumbList emits a JSON-LD
 * blob that conforms to schema.org's BreadcrumbList shape:
 *   - "@context": "https://schema.org"
 *   - "@type": "BreadcrumbList"
 *   - itemListElement: array of ListItem
 *   - each ListItem has @type "ListItem", an integer position (>= 1),
 *     a name, and an item URL
 *   - positions are sequential 1..N with no duplicates or gaps
 *
 * We extract the JS object literal that represents the BreadcrumbList
 * directly from page source so no rendering / network is required.
 */

const SITE_BASE = "https://www.comparewaterfilters.com.au";

/**
 * Expected absolute URL path for each ListItem position (1..N) per page.
 * Position 1 is always "/" (Home). Dynamic segments use a `<dynamic>`
 * placeholder that matches any non-empty path segment.
 */
interface PageSpec {
  file: string;
  expectedPaths: string[]; // index 0 = position 1, etc.
}

const PAGES: PageSpec[] = [
  { file: "src/pages/AboutPage.tsx", expectedPaths: ["/", "/about"] },
  {
    file: "src/pages/ArticlePage.tsx",
    expectedPaths: ["/", "/learn", "/learn/<dynamic>"],
  },
  { file: "src/pages/ContactPage.tsx", expectedPaths: ["/", "/contact"] },
  { file: "src/pages/HowItWorksPage.tsx", expectedPaths: ["/", "/how-it-works"] },
  { file: "src/pages/LearnPage.tsx", expectedPaths: ["/", "/learn"] },
  { file: "src/pages/PricingGuidePage.tsx", expectedPaths: ["/", "/pricing-guide"] },
  { file: "src/pages/SystemTypesPage.tsx", expectedPaths: ["/", "/system-types"] },
  { file: "src/pages/WaterQualityPage.tsx", expectedPaths: ["/", "/water-quality"] },
];

function read(file: string): string {
  return readFileSync(resolve(process.cwd(), file), "utf8");
}

/** Find the matching closing bracket for the opener at `openIdx`. */
function findMatching(src: string, openIdx: number, open: string, close: string): number {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

interface RawListItem {
  raw: string;
  hasListItemType: boolean;
  position: number | null;
  positionRaw: string;
  name: string | null;
  hasItem: boolean;
  /** Resolved absolute URL string with BASE_URL substituted, or null. */
  itemUrl: string | null;
  /** Raw item expression (for diagnostics). */
  itemRaw: string | null;
}

interface BreadcrumbBlock {
  context: string | null;
  type: string | null;
  itemListElementRaw: string;
  items: RawListItem[];
}

function extractBreadcrumbBlock(src: string): BreadcrumbBlock | null {
  const typeIdx = src.indexOf('"@type": "BreadcrumbList"');
  if (typeIdx === -1) return null;

  // Walk backward to the opening `{` of the enclosing object.
  let depth = 0;
  let objStart = -1;
  for (let i = typeIdx; i >= 0; i--) {
    const ch = src[i];
    if (ch === "}") depth++;
    else if (ch === "{") {
      if (depth === 0) {
        objStart = i;
        break;
      }
      depth--;
    }
  }
  if (objStart === -1) return null;

  const objEnd = findMatching(src, objStart, "{", "}");
  if (objEnd === -1) return null;
  const block = src.slice(objStart, objEnd + 1);

  const ctxMatch = block.match(/"@context"\s*:\s*"([^"]+)"/);
  const typeMatch = block.match(/"@type"\s*:\s*"(BreadcrumbList)"/);

  const arrKeyIdx = block.indexOf("itemListElement");
  const arrOpen = block.indexOf("[", arrKeyIdx);
  const arrClose = findMatching(block, arrOpen, "[", "]");
  const arrSrc = block.slice(arrOpen, arrClose + 1);

  // Parse each ListItem object inside the array.
  const items: RawListItem[] = [];
  let i = 0;
  while (i < arrSrc.length) {
    if (arrSrc[i] === "{") {
      const end = findMatching(arrSrc, i, "{", "}");
      const raw = arrSrc.slice(i, end + 1);

      const liType = /"@type"\s*:\s*"ListItem"/.test(raw);
      const posMatch = raw.match(/position\s*:\s*([^,}\s]+)/);
      const positionRaw = posMatch ? posMatch[1] : "";
      const positionNum = positionRaw && /^\d+$/.test(positionRaw)
        ? parseInt(positionRaw, 10)
        : null;

      const nameMatch = raw.match(/name\s*:\s*("([^"]+)"|`([^`]+)`|[A-Za-z0-9_.]+)/);
      let name: string | null = null;
      if (nameMatch) {
        name = nameMatch[2] ?? nameMatch[3] ?? nameMatch[1];
      }

      const hasItem = /\bitem\s*:/.test(raw);
      const { itemUrl, itemRaw } = extractItemUrl(raw);

      items.push({
        raw,
        hasListItemType: liType,
        position: positionNum,
        positionRaw,
        name,
        hasItem,
        itemUrl,
        itemRaw,
      });
      i = end + 1;
    } else {
      i++;
    }
  }

  return {
    context: ctxMatch?.[1] ?? null,
    type: typeMatch?.[1] ?? null,
    itemListElementRaw: arrSrc,
    items,
  };
}

describe("BreadcrumbList JSON-LD schema conformance", () => {
  for (const file of PAGES) {
    describe(file, () => {
      const src = read(file);
      const block = extractBreadcrumbBlock(src);

      it("declares a BreadcrumbList block", () => {
        expect(block, `No BreadcrumbList object found in ${file}`).not.toBeNull();
      });

      it('uses "@context": "https://schema.org" (own or inherited from parent JSON-LD)', () => {
        // BreadcrumbList may be nested under a parent (e.g. AboutPage) that
        // declares the schema.org context. Accept either local or any
        // schema.org context elsewhere in the same source file.
        const ownOrInherited =
          block?.context === "https://schema.org" ||
          /"@context"\s*:\s*"https:\/\/schema\.org"/.test(src);
        expect(ownOrInherited).toBe(true);
      });

      it('uses "@type": "BreadcrumbList"', () => {
        expect(block?.type).toBe("BreadcrumbList");
      });

      it("itemListElement is a non-empty array", () => {
        expect(block?.items.length).toBeGreaterThan(0);
      });

      it('every itemListElement entry has @type "ListItem"', () => {
        for (const [idx, item] of (block?.items ?? []).entries()) {
          expect(
            item.hasListItemType,
            `Item at index ${idx} is missing @type "ListItem" in ${file}`,
          ).toBe(true);
        }
      });

      it("every position is an integer literal (no strings, floats, or expressions)", () => {
        for (const [idx, item] of (block?.items ?? []).entries()) {
          expect(
            /^\d+$/.test(item.positionRaw),
            `Position at index ${idx} is not an integer literal: "${item.positionRaw}" in ${file}`,
          ).toBe(true);
          expect(item.position).not.toBeNull();
          expect(item.position! >= 1).toBe(true);
        }
      });

      it("positions are sequential 1..N with no duplicates or gaps", () => {
        const positions = (block?.items ?? []).map((i) => i.position);
        const expected = positions.map((_, idx) => idx + 1);
        expect(positions).toEqual(expected);
      });

      it("every ListItem declares a name", () => {
        for (const [idx, item] of (block?.items ?? []).entries()) {
          expect(
            item.name && item.name.length > 0,
            `Item at index ${idx} is missing a name in ${file}`,
          ).toBe(true);
        }
      });

      it("every ListItem declares an item URL", () => {
        for (const [idx, item] of (block?.items ?? []).entries()) {
          expect(
            item.hasItem,
            `Item at index ${idx} is missing 'item' (URL) in ${file}`,
          ).toBe(true);
        }
      });
    });
  }
});
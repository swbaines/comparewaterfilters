import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * H1 ↔ last-breadcrumb parity.
 *
 * Each marketing route should render exactly one <h1> whose visible text
 * equals the final crumb passed to <Breadcrumbs items={[…]} />. This keeps
 * the on-page heading, the visible breadcrumb tail, and the JSON-LD
 * BreadcrumbList terminus in agreement — important for SEO (semantic
 * heading hierarchy) and accessibility (screen-reader landmark labels).
 *
 * Static analysis only: we scan each page source for:
 *   1. The `<Breadcrumbs items={[…]} />` JSX → take the LAST item's `label`.
 *   2. The first `<h1 …>…</h1>` literal text → strip JSX whitespace.
 * and assert they match (case-sensitive, trimmed).
 *
 * Pages with dynamic H1s (e.g. ArticlePage's `{article.title}`) are
 * validated structurally: the H1 expression must equal the breadcrumb
 * tail expression.
 */

interface PageSpec {
  file: string;
  /** Optional: dynamic H1 expression that must equal the final crumb expression. */
  dynamic?: { h1Expr: string; crumbExpr: string };
}

const STATIC_PAGES: PageSpec[] = [
  { file: "src/pages/AboutPage.tsx" },
  { file: "src/pages/ContactPage.tsx" },
  { file: "src/pages/HowItWorksPage.tsx" },
  { file: "src/pages/LearnPage.tsx" },
  { file: "src/pages/PricingGuidePage.tsx" },
  { file: "src/pages/SystemTypesPage.tsx" },
  { file: "src/pages/WaterQualityPage.tsx" },
];

function read(file: string): string {
  return readFileSync(resolve(process.cwd(), file), "utf8");
}

/** Extract the final `label: "..."` from the first `<Breadcrumbs items={[ ... ]} />`. */
function extractLastBreadcrumbLabel(src: string): string | null {
  const start = src.indexOf("<Breadcrumbs");
  if (start === -1) return null;
  const itemsIdx = src.indexOf("items={[", start);
  if (itemsIdx === -1) return null;
  const open = src.indexOf("[", itemsIdx);
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
  if (end === -1) return null;
  const block = src.slice(open, end + 1);
  // Pull every `label: "..."` (or single-quoted) — last one wins.
  const labelRe = /label\s*:\s*(?:"([^"]+)"|'([^']+)')/g;
  let last: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(block)) !== null) {
    last = m[1] ?? m[2];
  }
  return last;
}

/** Extract the visible text of the first `<h1 …>…</h1>` block (strips inner JSX whitespace). */
function extractFirstH1Text(src: string): string | null {
  const open = src.search(/<h1[\s>]/);
  if (open === -1) return null;
  const tagEnd = src.indexOf(">", open);
  const close = src.indexOf("</h1>", tagEnd);
  if (close === -1) return null;
  let inner = src.slice(tagEnd + 1, close);
  // Strip JSX comments and surrounding whitespace.
  inner = inner.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim();
  return inner.length ? inner : null;
}

describe("H1 matches the last breadcrumb label", () => {
  for (const page of STATIC_PAGES) {
    describe(page.file, () => {
      const src = read(page.file);
      const lastCrumb = extractLastBreadcrumbLabel(src);
      const h1 = extractFirstH1Text(src);

      it("declares a <Breadcrumbs items=… /> with at least one label", () => {
        expect(lastCrumb, `No breadcrumb label found in ${page.file}`).not.toBeNull();
      });

      it("renders an <h1>", () => {
        expect(h1, `No <h1> found in ${page.file}`).not.toBeNull();
      });

      it("the <h1> text equals the last breadcrumb label", () => {
        expect(h1).toBe(lastCrumb);
      });
    });
  }

  describe("src/pages/ArticlePage.tsx (dynamic)", () => {
    const src = read("src/pages/ArticlePage.tsx");

    it("uses {article.title} as both the final crumb and the <h1>", () => {
      // Final crumb expression
      const lastCrumbExpr = (() => {
        const start = src.indexOf("<Breadcrumbs");
        const open = src.indexOf("[", start);
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
        // Last `label: <expr>` — capture identifier/member-expression form.
        const re = /label\s*:\s*([A-Za-z_$][\w$.]*)/g;
        let last: string | null = null;
        let m: RegExpExecArray | null;
        while ((m = re.exec(block)) !== null) last = m[1];
        return last;
      })();

      // First non-error H1 (the article body, not the "Article not found" fallback).
      // We pick the H1 that contains a JSX expression `{...}`.
      const dynH1Re = /<h1[^>]*>\s*\{([A-Za-z_$][\w$.]*)\}\s*<\/h1>/g;
      const matches = [...src.matchAll(dynH1Re)];
      const dynH1Expr = matches.length ? matches[0][1] : null;

      expect(lastCrumbExpr, "Final crumb must be a dynamic expression").toBe(
        "article.title",
      );
      expect(dynH1Expr, "Article body <h1> must render {article.title}").toBe(
        "article.title",
      );
    });
  });
});
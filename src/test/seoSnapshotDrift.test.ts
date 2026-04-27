import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROUTES, diffRouteAgainstSource } from "@/lib/seoSnapshot";

/**
 * Regression: the snapshot in src/lib/seoSnapshot.ts (rendered at
 * /admin/seo-preview) must stay in sync with the literal title /
 * description / ogImage props on each page's <PageMeta />.
 *
 * Update src/lib/seoSnapshot.ts whenever a page's PageMeta changes.
 */
describe("SEO snapshot drift (admin/seo-preview vs source pages)", () => {
  for (const meta of ROUTES) {
    if (meta.dynamic) continue;
    it(`${meta.route} matches ${meta.source}`, () => {
      const filePath = resolve(process.cwd(), meta.source);
      expect(existsSync(filePath), `${meta.source} not found`).toBe(true);
      const source = readFileSync(filePath, "utf8");
      const drift = diffRouteAgainstSource(meta, source);
      expect(
        drift,
        drift
          .map(
            (d) =>
              `\n  • ${d.field}\n    expected: ${d.expected}\n    actual:   ${d.actual}`,
          )
          .join(""),
      ).toEqual([]);
    });
  }
});

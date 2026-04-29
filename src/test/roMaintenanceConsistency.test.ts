import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { SYSTEM_PRICING } from "@/lib/systemPricing";
import { recommendations } from "@/data/recommendations";
import { systemTypes } from "@/data/systemTypes";

/**
 * Site-wide consistency check for the canonical Reverse Osmosis annual
 * maintenance range: $150–$200/yr.
 *
 * Any reference to RO maintenance pricing across the codebase MUST match
 * this canonical range. Combo and other system ranges are excluded — this
 * test only guards the standalone RO line item.
 */

const CANONICAL_MIN = 150;
const CANONICAL_MAX = 200;

describe("RO maintenance consistency", () => {
  it("systemPricing.ts canonical entry is $150–$200/yr", () => {
    const ro = SYSTEM_PRICING["reverse-osmosis"];
    expect(ro.annualMin).toBe(CANONICAL_MIN);
    expect(ro.annualMax).toBe(CANONICAL_MAX);
  });

  it("recommendations.ts RO entry is $150–$200/yr", () => {
    const ro = recommendations.find((r) => r.id === "reverse-osmosis");
    expect(ro).toBeDefined();
    expect(ro!.annualMaintenanceMin).toBe(CANONICAL_MIN);
    expect(ro!.annualMaintenanceMax).toBe(CANONICAL_MAX);
  });

  it("systemTypes.ts RO entry mentions $150–$200 in maintenance text", () => {
    const ro = systemTypes.find(
      (s) => s.id === "reverse-osmosis" || s.slug === "reverse-osmosis",
    );
    expect(ro).toBeDefined();
    expect(ro!.maintenance).toMatch(/\$150\s*[–-]\s*\$?200/);
  });

  it("no source file mentions a stale RO maintenance range", () => {
    const ROOT = join(process.cwd(), "src");

    // Files allowed to reference other ranges (combos, hard water bundles,
    // or this test file itself).
    const ALLOWLIST: string[] = [
      "test/roMaintenanceConsistency.test.ts",
      // Article content covers broader budget ranges across systems.
      "data/articles.ts",
    ];

    // Phrases that indicate the surrounding text is talking about RO
    // maintenance specifically (not whole-house, combo, or general).
    const RO_KEYWORDS = [
      "reverse osmosis",
      "reverse-osmosis",
      " ro ",
      "ro system",
      "ro unit",
      "ro membrane",
    ];

    // Match dollar maintenance ranges like "$150–$250/year", "$150-$300/yr".
    // Maintenance ranges are typically under $1,000.
    const RANGE_RE = /\$(\d{2,3})\s*[–-]\s*\$?(\d{2,3})(?=\s*(?:\/\s*(?:yr|year)|\s*(?:per\s+year|annually)))/gi;

    function walk(dir: string, files: string[] = []): string[] {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          if (entry === "node_modules" || entry.startsWith(".")) continue;
          walk(full, files);
        } else if (/\.(tsx?|jsx?|md)$/.test(entry)) {
          files.push(full);
        }
      }
      return files;
    }

    const files = walk(ROOT);
    const violations: string[] = [];

    for (const abs of files) {
      const rel = relative(ROOT, abs).replace(/\\/g, "/");
      if (ALLOWLIST.includes(rel)) continue;

      const content = readFileSync(abs, "utf8");
      const lines = content.split(/\r?\n/);

      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        const mentionsRo = RO_KEYWORDS.some((k) => lower.includes(k));
        if (!mentionsRo) return;
        // Skip combo/whole-house contexts that legitimately use other ranges.
        if (/combo|whole[\s-]house|hybrid|softener|uv\s/.test(lower)) return;

        for (const m of line.matchAll(RANGE_RE)) {
          const min = Number(m[1]);
          const max = Number(m[2]);
          if (min !== CANONICAL_MIN || max !== CANONICAL_MAX) {
            violations.push(
              `${rel}:${idx + 1}  "${m[0]}" — expected $${CANONICAL_MIN}–$${CANONICAL_MAX}/yr`,
            );
          }
        }
      });
    }

    if (violations.length) {
      throw new Error(
        `Found ${violations.length} stale RO maintenance reference(s):\n` +
          violations.map((v) => `  • ${v}`).join("\n") +
          `\n\nCanonical RO maintenance range is $${CANONICAL_MIN}–$${CANONICAL_MAX}/yr. ` +
          `Update the reference or add the file to ALLOWLIST if intentional.`,
      );
    }

    expect(violations).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Site-wide pricing consistency check for the
 * "Whole House + Drinking Water Combo" (a.k.a. "whole-house-combo" / "hybrid").
 *
 * Canonical ranges:
 *   - Overall installed range: $3,000 – $6,000
 *   - Premium build range:     $5,000 – $6,000
 *
 * This test scans all source files under src/ and flags any literal
 * dollar range that mentions the combo product but falls outside the
 * canonical bounds (e.g. "$4,000–$8,000", "$6,500+").
 *
 * Files allowed to legitimately mention other ranges (e.g. budget-aware
 * "Premium" alternatives in the recommendation engine, or city-specific
 * articles that talk about whole-house only) can be added to ALLOWLIST.
 */

const ROOT = join(process.cwd(), "src");

// Files that intentionally reference different ranges and should be skipped.
const ALLOWLIST: string[] = [
  // This test file itself contains the "bad" example strings.
  "test/comboPricingConsistency.test.ts",
  // Hard-water rule references a softener+combo bundle ($6k–$12k).
  "lib/recommendationEngine.ts",
];

// Canonical numeric bounds for any range associated with the combo.
const MIN_ALLOWED = 3000;
const MAX_ALLOWED = 6000;

// Keywords that indicate the surrounding text is talking about the combo.
const COMBO_KEYWORDS = [
  "whole-house-combo",
  "Whole House + Drinking Water Combo",
  "Whole House + RO",
  "whole house combo",
  "whole house + drinking water",
  "whole house + ro",
  "combo system",
  "hybrid system",
];

// Match dollar ranges like "$3,000–$6,000", "$4,000-$8,000", "$6,500+".
const RANGE_RE = /\$(\d{1,3}(?:,\d{3})?)(?:\s*[–\-]\s*\$?(\d{1,3}(?:,\d{3})?))?(\+?)/g;

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

function parseDollar(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function lineMentionsCombo(line: string): boolean {
  const lower = line.toLowerCase();
  return COMBO_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

describe("Combo pricing consistency", () => {
  const files = walk(ROOT);

  it("no source file mentions an out-of-range price for the Whole House + RO combo", () => {
    const violations: string[] = [];

    for (const abs of files) {
      const rel = relative(ROOT, abs).replace(/\\/g, "/");
      if (ALLOWLIST.includes(rel)) continue;

      const lines = readFileSync(abs, "utf8").split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (!lineMentionsCombo(line)) return;

        for (const m of line.matchAll(RANGE_RE)) {
          const min = parseDollar(m[1]);
          const max = parseDollar(m[2]);
          const plus = m[3] === "+";

          // Skip tiny standalone numbers (e.g. "$80–$200/yr maintenance").
          if (min !== null && min < 1000 && (max === null || max < 1000)) continue;

          // Flag any "$X,XXX+" open-ended range over the cap.
          if (plus && min !== null && min >= MAX_ALLOWED) {
            violations.push(`${rel}:${idx + 1}  "${m[0]}" — open-ended range exceeds $${MAX_ALLOWED}`);
            continue;
          }

          if (min !== null && (min < MIN_ALLOWED || min > MAX_ALLOWED)) {
            violations.push(`${rel}:${idx + 1}  "${m[0]}" — min $${min} outside $${MIN_ALLOWED}–$${MAX_ALLOWED}`);
          }
          if (max !== null && (max < MIN_ALLOWED || max > MAX_ALLOWED)) {
            violations.push(`${rel}:${idx + 1}  "${m[0]}" — max $${max} outside $${MIN_ALLOWED}–$${MAX_ALLOWED}`);
          }
        }
      });
    }

    if (violations.length) {
      throw new Error(
        `Found ${violations.length} stale combo pricing reference(s):\n` +
          violations.map((v) => `  • ${v}`).join("\n") +
          `\n\nCanonical combo range is $${MIN_ALLOWED}–$${MAX_ALLOWED}. ` +
          `Add the file to ALLOWLIST in this test if the mention is intentional.`,
      );
    }

    expect(violations).toEqual([]);
  });
});
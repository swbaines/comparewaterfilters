import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * End-to-end guarantee that the "View my saved results" email button always
 * routes the recipient to their personalised /results?d=... page (and never
 * silently regresses to the homepage).
 *
 * We can't render the Deno/npm-prefixed email template directly under Vitest,
 * so instead we lock in the contract at the source level:
 *
 *  1. ResultsPage builds an absolute https://comparewaterfilters.com.au/results?d=<encoded>
 *     URL from the user's encoded answers and passes it as `resultsUrl`.
 *  2. The email template renders the CTA button with href={resultsUrl},
 *     and falls back to the /quiz page (never the bare homepage) when the
 *     caller forgets to pass one.
 */

const read = (rel: string) =>
  readFileSync(resolve(process.cwd(), rel), "utf8");

describe("Saved-results email — 'View my saved results' deep link", () => {
  const template = read(
    "supabase/functions/_shared/transactional-email-templates/quiz-results-summary.tsx",
  );
  const resultsPage = read("src/pages/ResultsPage.tsx");

  it("email CTA button is wired to the resultsUrl prop", () => {
    // The visible button label must stay in sync with the screenshot the user
    // showed us — if someone renames it we want this test to flag it.
    expect(template).toMatch(/View my saved results/);
    // The CTA's href MUST come from the resultsUrl prop, not a hard-coded URL.
    expect(template).toMatch(/<Button[^>]*href=\{resultsUrl\}/);
  });

  it("falls back to the /quiz page (not the homepage) when no resultsUrl is provided", () => {
    // Default value for the prop should land on /quiz so the recipient can at
    // least retake the quiz instead of landing on a generic marketing page.
    expect(template).toMatch(/resultsUrl\s*=\s*`\$\{SITE_URL\}\/quiz`/);
    // And the SITE_URL constant itself must be the production domain.
    expect(template).toMatch(
      /const\s+SITE_URL\s*=\s*['"]https:\/\/comparewaterfilters\.com\.au['"]/,
    );
  });

  it("ResultsPage sends the canonical production /results?d=<encoded> URL as resultsUrl", () => {
    // Isolate the handleEmailResults block so we only assert against the
    // email-sending code path, not unrelated share-link logic that may
    // legitimately use window.location.origin.
    const handlerMatch = resultsPage.match(
      /handleEmailResults[\s\S]*?templateName:\s*["']quiz-results-summary["'][\s\S]*?\}\);/,
    );
    expect(handlerMatch, "handleEmailResults block should exist").toBeTruthy();
    const handler = handlerMatch![0];

    // Must encode the answers payload via base64 (btoa) so the link is
    // self-contained and re-hydrates the user's quiz state on click.
    expect(handler).toMatch(/btoa\(JSON\.stringify\(answers\)\)/);

    // Must build an absolute URL pointing at the production host — using
    // window.location.origin would leak preview / lovable.app domains into
    // emails, breaking the link for the recipient.
    expect(handler).toMatch(
      /https:\/\/comparewaterfilters\.com\.au\/results\?d=\$\{encoded\}/,
    );
    expect(handler).not.toMatch(
      /\$\{window\.location\.origin\}\/results\?d=/,
    );

    // And that URL must be passed through to the email template as resultsUrl.
    expect(handler).toMatch(/resultsUrl:\s*url\b/);
  });
});

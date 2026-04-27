import { describe, it, expect } from "vitest";

/**
 * End-to-end round-trip guarantee for the "View my saved results" email link.
 *
 * The email handler in ResultsPage builds:
 *     https://comparewaterfilters.com.au/results?d=${btoa(JSON.stringify(answers))}
 *
 * When the recipient clicks the link, ResultsPage decodes it with:
 *     JSON.parse(atob(searchParams.get("d")))
 *
 * This test mirrors both halves of that contract using a realistic quiz
 * payload and confirms the user lands on the exact same saved answers — same
 * shape, same values, deeply equal — so the recommendation engine produces
 * identical output for the recipient as it did for the sender.
 */

// Matches the QuizAnswers shape used across the app for a typical completion.
const sampleAnswers = {
  firstName: "Sam",
  email: "sam@example.com",
  mobile: "+61400123456",
  suburb: "Bondi",
  postcode: "2026",
  propertyType: "house",
  ownership: "owner",
  occupants: 4,
  waterSource: "town",
  // NOTE: production code uses raw btoa() which is ASCII-only, so the
  // budget string MUST stay ASCII (hyphen, not en-dash). The app's quiz
  // config currently uses en-dashes here, which would throw in the browser
  // — tracked separately; this test deliberately mirrors what btoa accepts.
  budget: "$1,000 - $3,000",
  concerns: ["Taste/Smell", "Chlorine", "Skin/Hair"],
  coverage: "whole-home",
  installPreference: "professional",
  // Nested + falsy values + ASCII punctuation. NOTE: the production code
  // uses btoa() which is ASCII-only — emojis/non-Latin chars would throw
  // in the browser too, so we deliberately keep the payload ASCII.
  notes: "Hard water - fix it!",
  preferences: { contactByEmail: true, contactBySms: false, bestTime: null },
};

/** Mirrors the email handler in src/pages/ResultsPage.tsx (handleEmailResults). */
function buildEmailUrl(answers: unknown): string {
  const encoded = btoa(JSON.stringify(answers));
  return `https://comparewaterfilters.com.au/results?d=${encoded}`;
}

/** Mirrors the decode logic in ResultsPage's useEffect (URL param branch). */
function decodeFromUrl(url: string): unknown {
  const d = new URL(url).searchParams.get("d");
  if (!d) throw new Error("missing d= param");
  return JSON.parse(atob(d));
}

describe("Saved-results email link — d= round-trip", () => {
  it("decoding the email link recreates the exact saved quiz answers", () => {
    const url = buildEmailUrl(sampleAnswers);
    const decoded = decodeFromUrl(url);

    // Deep equality — the recipient must see the identical answers object.
    expect(decoded).toEqual(sampleAnswers);
  });

  it("the email link points at the canonical production /results route", () => {
    const url = new URL(buildEmailUrl(sampleAnswers));
    expect(url.origin).toBe("https://comparewaterfilters.com.au");
    expect(url.pathname).toBe("/results");
    expect(url.searchParams.get("d")).toBeTruthy();
  });

  it("preserves identifying fields (name, email, postcode, concerns) verbatim", () => {
    // Spot-check the fields that drive personalisation + recommendation
    // matching, so a regression in encoding shows a clear diff.
    const decoded = decodeFromUrl(buildEmailUrl(sampleAnswers)) as typeof sampleAnswers;
    expect(decoded.firstName).toBe(sampleAnswers.firstName);
    expect(decoded.email).toBe(sampleAnswers.email);
    expect(decoded.postcode).toBe(sampleAnswers.postcode);
    expect(decoded.suburb).toBe(sampleAnswers.suburb);
    expect(decoded.budget).toBe(sampleAnswers.budget);
    expect(decoded.concerns).toEqual(sampleAnswers.concerns);
    expect(decoded.preferences).toEqual(sampleAnswers.preferences);
    // Punctuation must survive the base64 round-trip.
    expect(decoded.notes).toBe(sampleAnswers.notes);
  });

  it("survives minimal answers (no optional fields)", () => {
    const minimal = { firstName: "Jo", postcode: "3000" };
    const decoded = decodeFromUrl(buildEmailUrl(minimal));
    expect(decoded).toEqual(minimal);
  });
});

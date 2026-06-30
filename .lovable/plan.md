# Results Page Redesign — Value-First Flow

Restructure `/results` so users see their recommendation, expected cost, and matched installers *before* the contact form. Goal: reduce drop-off at the contact step by making it feel like a small final step, not a toll gate.

## Scope

Rebuild `src/pages/ResultsPage.tsx` and `src/components/MatchedVendorsSection.tsx`. Add small helpers for vendor scoring, "why matched" reasons, and a pricing-range flag. No new libraries — use existing shadcn/ui + Tailwind tokens.

## Page sections (top → bottom)

1. **Header** — eyebrow + warm H1 + subline.
2. **Quiz recap chips** — 5–7 chips from `quiz_submissions` (water source, top concerns, household size, coverage, budget, timeline, suburb). "Edit your answers" link returns to quiz with state preserved.
3. **Recommended system card** — badge, system name, personalised "why this suits you" lede built from their concerns + coverage, "What it removes" green check chips, sidebar price box (install / yearly filters / lifespan), amber "cheaper alternative" callout.
4. **Cost in their area** — big range + midpoint, visual price bar, drivers up/down, green reassurance note. Only renders when the system's `show_price_range` flag is true (skip supply-only / >3× spread).
5. **Matched installers** — restructured vendor cards with selection checkbox (all 3 pre-selected), match badge (Top / Strong / Good) from a weighted score (response 40%, rating×reviews 35%, conversion 25% — new vendors get platform average), meta row, "Why we matched them to you" cream panel with 2–3 dynamic bullets, certification + specialisation chips.
6. **What happens next** — 3-step horizontal (stacks on mobile) + reassurance flags.
7. **Trust strip** — dark background, 4 bullets in 2-col grid.
8. **Contact form** — green security strip, dynamic H2 (`Send my request to {N} installer{s}`), 3 fields (first name, mobile, email), drop required "preferred contact method", full-width green CTA, fine print with Terms/Privacy.
9. **Sticky mobile bar** — `{N} installers selected` + CTA that scrolls to form. Mobile only.

## Dynamic logic

- **Recap chips**: read current `quiz_submissions` row already loaded on the page.
- **Recommended system / removes / pricing**: existing `recommendationEngine.ts` + `systemPricing.ts` (add `showPriceRange: boolean` and `removes: string[]` per system; default `true` for filter systems, `false` for supply-only).
- **Vendor match score** (`src/lib/vendorMatchScore.ts`): normalise the three signals across the matched set, weight 40/35/25, rank → Top / Strong / Good.
- **Why-matched bullets** (`src/lib/vendorMatchReasons.ts`): pure function `(vendor, quiz, recommendation) → string[]` applying the rule list, capped at 3, falls back to "Services your area" if <2 hits.
- **Save submission early**: persist the `quiz_submissions` row on results-page mount (if not already saved) so funnel drop-off after the recommendation is measurable. `quote_requests` row stays gated on form submit; HubSpot sync unchanged.

## Tracking

`trackEvent` helper firing both `gtag` and `window.clarity('event', …)`:

- `recommendation_viewed` — on mount once card is in DOM.
- `vendor_selection_changed` — checkbox toggle, payload `{ vendor_id, selected, total_selected }`.
- `contact_form_focused` — first focus on any contact field per session.
- `quote_requested` — successful submit (key conversion).
- `vendor_card_expanded` — wired but no-op until expansion UI exists.

## Files

- **Edit**: `src/pages/ResultsPage.tsx`, `src/components/MatchedVendorsSection.tsx`, `src/lib/systemPricing.ts` (add `showPriceRange`, `removes`, `alternative`).
- **Add**: `src/components/results/QuizRecapChips.tsx`, `RecommendedSystemCard.tsx`, `CostInYourAreaSection.tsx`, `WhatHappensNextSection.tsx`, `TrustStrip.tsx`, `StickyMobileBar.tsx`, `src/lib/vendorMatchScore.ts`, `src/lib/vendorMatchReasons.ts`, `src/lib/resultsAnalytics.ts`.
- **Unchanged**: quiz flow, vendor matching SQL, lead pricing, HubSpot sync, vendor/admin pages.

## Out of scope

Quiz changes, matching algorithm (which vendors qualify), lead pricing, billing, vendor portal, admin pages.

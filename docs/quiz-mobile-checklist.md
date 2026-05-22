# Quiz Page — Mobile Visual Checklist

Run through this checklist whenever the quiz page (`/quiz`) layout changes.
Use the device toolbar in the preview (or Chrome DevTools) at each width.

## Breakpoints to check

| Device                | Width | Height |
| --------------------- | ----- | ------ |
| iPhone SE (small)     | 320   | 568    |
| Android small         | 360   | 800    |
| iPhone 12/13/14       | 390   | 844    |
| iPhone 14 Plus        | 414   | 896    |
| iPad mini (portrait)  | 768   | 1024   |

## On every step (1–8)

- [ ] Page does not scroll horizontally.
- [ ] Step heading (h2) fits on one line inside the card with no clipping.
- [ ] Step subtitle / helper text is readable (not below ~12px).
- [ ] Progress bar and the 8 numbered checkpoints fit on one row, no wrap or overflow.
- [ ] Step checkpoint circles are tappable (≥36px hit area).
- [ ] Primary CTA ("Next" / "Find My System") is full-width and not cut off.
- [ ] Form labels sit above inputs; inputs are full-width with no overflow.
- [ ] Radio / option buttons wrap cleanly and remain tappable.
- [ ] Error messages appear in red beneath the relevant field, not over it.

## Step-specific spot checks

- **Step 1 (Concerns):** Top hero card heading + subtitle render above the progress bar.
- **Step 2 (Water source):** Town vs tank options remain side-by-side or stack cleanly.
- **Step 3 (Household):** People / bathrooms selectors stay in a 2-column grid down to 360px.
- **Step 4 (Coverage):** Replacement/upgrade callout box stays inside the card.
- **Step 5 (Budget):** Budget tiers stack vertically; maintenance slider labels readable.
- **Step 6 (Priorities):** Multi-select chips wrap, no overflow.
- **Step 7 (Notes):** Textarea fills card width and is at least 4 rows tall.
- **Step 8 (Contact):** First name / email / mobile inputs all visible above the fold on 390px height.

## Automated coverage

`e2e/quiz-mobile.spec.ts` runs the same viewport list and asserts:

- No horizontal document overflow.
- The step `h2` does not overflow its container.
- The progress checkpoints row does not overflow.
- A full-page screenshot is captured for visual diffing.

Run with `npx playwright test e2e/quiz-mobile.spec.ts`.
## Problem
On mobile (iPhone viewport), the hero heading and paragraph text are bunched together near the top, leaving a large empty gap above the "Find My Water Filter" button.

## Solution
Distribute the two text blocks vertically so they span evenly between the header and the CTA button.

### Steps
1. In `src/pages/HomePage.tsx`, update the hero inner layout:
   - Make the text-content wrapper a flex column that grows to fill available space.
   - Use `justify-evenly` (or `justify-between` + padding) to spread the badge/heading and paragraph vertically across the gap.
2. Keep the buttons anchored at the bottom with their existing `pb-4`.
3. Verify with a mobile screenshot that the heading sits higher, the paragraph sits lower, and the gap between them looks balanced.

## Technical details
- File: `src/pages/HomePage.tsx` (hero section, lines ~240–270)
- Approach: Tailwind flex utilities only — no custom CSS.
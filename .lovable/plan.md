## Goal
Move the "Do you want clean water for your home?" heading slightly higher within the hero section on the homepage.

## Approach
Tighten vertical spacing in the hero section by reducing top padding on the `<section>` and/or adjusting the flex container distribution so the heading sits closer to the top of the hero area.

## Details
- **File:** `src/pages/HomePage.tsx`
- **Target:** Hero section (`<section>` at line 240) and its flex wrapper (`<div>` at line 241)
- **Change:** Reduce `pt-2` (or `sm:py-12` / `lg:py-14` breakpoints) and/or change `justify-evenly` to `justify-start` with a small top margin on the heading to nudge it upward.
- **Result:** The heading will appear slightly higher on the page without affecting other sections.

## Note
Manual drag-and-drop to reposition elements is not available in the editor. Layout adjustments like this require a small code change to padding, margin, or flex alignment.
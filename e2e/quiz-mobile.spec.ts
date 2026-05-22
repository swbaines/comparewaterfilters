import { test, expect } from "../playwright-fixture";

const MOBILE_VIEWPORTS = [
  { name: "iPhone SE", width: 320, height: 568 },
  { name: "iPhone 12/13 mini", width: 360, height: 800 },
  { name: "iPhone 12/13/14", width: 390, height: 844 },
  { name: "iPhone 14 Plus", width: 414, height: 896 },
  { name: "iPad mini portrait", width: 768, height: 1024 },
];

for (const vp of MOBILE_VIEWPORTS) {
  test(`quiz page renders cleanly on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/quiz");

    // Step heading is visible and inside the card
    const stepHeading = page.getByRole("heading", { level: 2 });
    await expect(stepHeading).toBeVisible();

    // Top page H1 is visible on step 1
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // No horizontal overflow at the document level
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    // The step heading text must not overflow its container's width
    const headingFits = await stepHeading.evaluate((el) => {
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(headingFits).toBe(true);

    // Progress checkpoints row should not overflow
    const checkpoints = page.getByLabel("Quiz progress checkpoints");
    await expect(checkpoints).toBeVisible();
    const checkpointsFit = await checkpoints.evaluate(
      (el) => el.scrollWidth <= el.clientWidth + 1,
    );
    expect(checkpointsFit).toBe(true);

    // Snapshot for visual review
    await expect(page).toHaveScreenshot(`quiz-${vp.width}x${vp.height}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
}
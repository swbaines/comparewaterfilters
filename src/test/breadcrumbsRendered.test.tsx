import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, within, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Breadcrumbs from "@/components/Breadcrumbs";

/**
 * Rendered-UI BreadcrumbList parity.
 *
 * Complements `breadcrumbParity.test.ts` (static source scan) by actually
 * mounting the <Breadcrumbs /> component with each marketing page's items
 * and asserting the visible <ol><li>… order matches the JSON-LD positions
 * + names extracted from the page source. Runs at both a desktop and a
 * mobile viewport width to confirm responsive layouts don't drop, reorder,
 * or hide crumbs.
 */

interface PageSpec {
  file: string;
  route: string;
  /** Items prop passed to <Breadcrumbs /> (matches each page's call site). */
  items: { label: string; href?: string }[];
}

const PAGES: PageSpec[] = [
  { file: "src/pages/AboutPage.tsx", route: "/about", items: [{ label: "About" }] },
  { file: "src/pages/ContactPage.tsx", route: "/contact", items: [{ label: "Contact" }] },
  { file: "src/pages/HowItWorksPage.tsx", route: "/how-it-works", items: [{ label: "How It Works" }] },
  { file: "src/pages/LearnPage.tsx", route: "/learn", items: [{ label: "Learn" }] },
  { file: "src/pages/PricingGuidePage.tsx", route: "/pricing-guide", items: [{ label: "Pricing Guide" }] },
  { file: "src/pages/SystemTypesPage.tsx", route: "/system-types", items: [{ label: "System Types" }] },
  { file: "src/pages/WaterQualityPage.tsx", route: "/water-quality", items: [{ label: "Water Quality" }] },
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 375, height: 812 },
] as const;

interface JsonLdItem {
  position: number;
  name: string;
}

function extractBreadcrumbItems(file: string): JsonLdItem[] {
  const src = readFileSync(resolve(process.cwd(), file), "utf8");
  const start = src.indexOf("BreadcrumbList");
  if (start === -1) return [];
  const arrStart = src.indexOf("itemListElement", start);
  const open = src.indexOf("[", arrStart);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = src.slice(open, end + 1);
  const items: JsonLdItem[] = [];
  const itemRe =
    /"@type"\s*:\s*"ListItem"[\s\S]*?position\s*:\s*(\d+)[\s\S]*?name\s*:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(block)) !== null) {
    items.push({ position: parseInt(m[1], 10), name: m[2] });
  }
  return items;
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
  // matchMedia returns matches based on max-width / min-width queries.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const maxMatch = /\(max-width:\s*(\d+)px\)/.exec(query);
      const minMatch = /\(min-width:\s*(\d+)px\)/.exec(query);
      let matches = false;
      if (maxMatch) matches = width <= parseInt(maxMatch[1], 10);
      else if (minMatch) matches = width >= parseInt(minMatch[1], 10);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    },
  });
  window.dispatchEvent(new Event("resize"));
}

describe("Breadcrumbs (rendered) parity at desktop + mobile", () => {
  afterEach(() => {
    cleanup();
  });

  for (const vp of VIEWPORTS) {
    describe(`viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      beforeEach(() => {
        setViewport(vp.width, vp.height);
      });

      for (const page of PAGES) {
        describe(page.file, () => {
          it("renders <ol> with Home + page crumbs in order, matching JSON-LD", () => {
            const jsonLd = extractBreadcrumbItems(page.file);
            expect(jsonLd.length).toBe(page.items.length + 1);

            const { container } = render(
              <MemoryRouter initialEntries={[page.route]}>
                <Breadcrumbs items={page.items} />
              </MemoryRouter>,
            );

            const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
            expect(nav, "Breadcrumb nav must render").not.toBeNull();

            const list = nav!.querySelector("ol");
            expect(list, "Breadcrumb ol must render").not.toBeNull();

            const lis = Array.from(list!.querySelectorAll(":scope > li"));
            // Visible <li> count == JSON-LD positions (Home + N).
            expect(lis.length).toBe(jsonLd.length);

            // Position 1 = Home — labelled via sr-only span.
            expect(within(lis[0]).getByText("Home")).toBeInTheDocument();
            const homeLink = lis[0].querySelector("a");
            expect(homeLink?.getAttribute("href")).toBe("/");

            // Positions 2..N must equal page.items in the same order, and
            // mirror the JSON-LD `name` fields at the same indices.
            for (let i = 0; i < page.items.length; i++) {
              const li = lis[i + 1];
              const expectedLabel = page.items[i].label;
              expect(li.textContent).toContain(expectedLabel);
              expect(jsonLd[i + 1].name).toBe(expectedLabel);
              expect(jsonLd[i + 1].position).toBe(i + 2);
            }
          });

          it("does not hide or collapse crumbs at this viewport", () => {
            const { container } = render(
              <MemoryRouter initialEntries={[page.route]}>
                <Breadcrumbs items={page.items} />
              </MemoryRouter>,
            );
            const lis = container.querySelectorAll(
              'nav[aria-label="Breadcrumb"] ol > li',
            );
            // Every crumb must be present in the DOM (no `hidden`, no `display:none`
            // applied via inline style) regardless of viewport width.
            lis.forEach((li) => {
              const el = li as HTMLElement;
              expect(el.hidden).toBe(false);
              expect(el.style.display).not.toBe("none");
            });
            expect(lis.length).toBe(page.items.length + 1);
          });
        });
      }
    });
  }

  describe("ArticlePage dynamic crumb (Home → Learn → <title>)", () => {
    beforeEach(() => setViewport(1280, 800));

    it("renders 3 crumbs in order with the article title last", () => {
      const articleTitle = "Test Article Title";
      const { container } = render(
        <MemoryRouter initialEntries={["/learn/test-article"]}>
          <Breadcrumbs
            items={[
              { label: "Learn", href: "/learn" },
              { label: articleTitle },
            ]}
          />
        </MemoryRouter>,
      );
      const lis = Array.from(
        container.querySelectorAll('nav[aria-label="Breadcrumb"] ol > li'),
      );
      expect(lis.length).toBe(3);
      expect(within(lis[0] as HTMLElement).getByText("Home")).toBeInTheDocument();
      expect(lis[1].textContent).toContain("Learn");
      expect(lis[1].querySelector("a")?.getAttribute("href")).toBe("/learn");
      expect(lis[2].textContent).toContain(articleTitle);
      // Final crumb must NOT be a link (current page).
      expect(lis[2].querySelector("a")).toBeNull();
    });
  });
});
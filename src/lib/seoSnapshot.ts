/**
 * Single source of truth for the SEO snapshot displayed at /admin/seo-preview
 * and validated by src/test/seoSnapshotDrift.test.ts.
 *
 * When you change a page's <PageMeta />, update the matching entry here.
 * The drift test will fail CI if these literals diverge from the page source,
 * and the admin SEO Preview will surface a red drift banner at runtime.
 */

export const BASE_URL = "https://www.comparewaterfilters.com.au";
export const SITE_NAME = "Compare Water Filters";
export const DEFAULT_OG = `${BASE_URL}/og-default.jpg`;

export interface RouteMeta {
  route: string;
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  source: string;
  /** False when PageMeta should use the exact title without appending SITE_NAME. */
  appendSiteName?: boolean;
  /** True when title/description are computed at runtime (skip drift check). */
  dynamic?: boolean;
}

export const ROUTES: RouteMeta[] = [
  {
    route: "/",
    source: "src/pages/HomePage.tsx",
    title: "Compare Whole House Water Filters Australia — Free Quotes",
    description:
      "Compare whole house water filters, reverse osmosis and under-sink systems across Australia. Free quotes from trusted local installers.",
    canonical: `${BASE_URL}/`,
    ogImage: DEFAULT_OG,
    appendSiteName: false,
  },
  {
    route: "/quiz",
    source: "src/pages/QuizPage.tsx",
    title: "Whole House Water Filter Quiz — Find Your Match",
    description:
      "Answer a few quick questions about your home and water concerns to get personalised whole house water filter recommendations and free quotes.",
    canonical: `${BASE_URL}/quiz`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/system-types",
    source: "src/pages/SystemTypesPage.tsx",
    title: "Compare Water Filter Types",
    description:
      "Compare whole house water filter types: reverse osmosis, under-sink carbon, UV and water softeners. Pros, cons, pricing and who each suits in Australia.",
    canonical: `${BASE_URL}/system-types`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/pricing-guide",
    source: "src/pages/PricingGuidePage.tsx",
    title: "Whole House Water Filter Prices 2026",
    description:
      "How much does a whole house water filter cost in Australia? Installed prices from $300–$6,000, maintenance costs and what affects pricing per system type.",
    canonical: `${BASE_URL}/pricing-guide`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/learn",
    source: "src/pages/LearnPage.tsx",
    title: "Whole House Filtration Guide for Your Home",
    description:
      "Plain-English guides on whole house water filters, reverse osmosis, water quality and pricing — helping Australian homeowners pick the right filtration system.",
    canonical: `${BASE_URL}/learn`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/learn/:slug",
    source: "src/pages/ArticlePage.tsx",
    title: "(article.title — dynamic per article)",
    description: "(article.seoDescription || article.summary)",
    canonical: `${BASE_URL}/learn/{slug}`,
    ogImage: DEFAULT_OG,
    dynamic: true,
  },
  {
    route: "/how-it-works",
    source: "src/pages/HowItWorksPage.tsx",
    title: "How It Works — Match With the Right Whole House Water Filter",
    description:
      "Three simple steps to find the right whole house water filter: take the quiz, get independent recommendations, and compare free quotes from licensed installers.",
    canonical: `${BASE_URL}/how-it-works`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/contact",
    source: "src/pages/ContactPage.tsx",
    title: "Contact Compare Water Filters — Whole House Filter Help",
    description:
      "Need help choosing a whole house water filter or comparing systems? Contact our independent Australian team for plain-English guidance.",
    canonical: `${BASE_URL}/contact`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/about",
    source: "src/pages/AboutPage.tsx",
    title: "About Compare Water Filters — Independent Platform",
    description:
      "Independent Australian platform helping households choose the right whole house water filter and connect with trusted local providers.",
    canonical: `${BASE_URL}/about`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/water-quality",
    source: "src/pages/WaterQualityPage.tsx",
    title: "Water Quality by Area — Hardness, Chlorine & Fluoride",
    description:
      "Free suburb water quality lookup for Australia. Check hardness, chlorine and fluoride, then get whole house water filter recommendations for your area.",
    canonical: `${BASE_URL}/water-quality`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/provider-match",
    source: "src/pages/ProviderMatchPage.tsx",
    title: "Match Whole House Water Filter Providers",
    description:
      "Request free quotes from vetted whole house water filter providers in your area. Independent, no-obligation matching across Australia.",
    canonical: `${BASE_URL}/provider-match`,
    ogImage: DEFAULT_OG,
  },
];

export interface DriftIssue {
  route: string;
  source: string;
  field: "title" | "description" | "ogImage" | "appendSiteName" | "missing";
  expected: string;
  actual: string;
}

/**
 * Extracts the literal title / description / ogImage props from the first
 * <PageMeta ... /> in a source file. Returns null when no PageMeta is present.
 */
export function extractPageMeta(
  src: string,
): { title: string; description: string; ogImage?: string; appendSiteName?: boolean } | null {
  const block = src.match(/<PageMeta\b[\s\S]*?\/>/);
  if (!block) return null;
  const titleMatch = block[0].match(/title="([^"]+)"/);
  const descMatch = block[0].match(/description="([^"]+)"/);
  if (!titleMatch || !descMatch) return null;
  const ogMatch = block[0].match(/ogImage="([^"]+)"/);
  const appendSiteNameMatch = block[0].match(/appendSiteName=\{(true|false)\}/);
  return {
    title: titleMatch[1],
    description: descMatch[1],
    ...(ogMatch ? { ogImage: ogMatch[1] } : {}),
    ...(appendSiteNameMatch ? { appendSiteName: appendSiteNameMatch[1] === "true" } : {}),
  };
}

/**
 * Compares a snapshot route against the literal extracted from its source.
 * Returns drift entries (one per mismatching field). Skips dynamic routes.
 */
export function diffRouteAgainstSource(
  meta: RouteMeta,
  source: string | undefined,
): DriftIssue[] {
  if (meta.dynamic) return [];
  if (!source) {
    return [
      {
        route: meta.route,
        source: meta.source,
        field: "missing",
        expected: "<source file readable>",
        actual: "source file not found",
      },
    ];
  }
  const extracted = extractPageMeta(source);
  if (!extracted) {
    return [
      {
        route: meta.route,
        source: meta.source,
        field: "missing",
        expected: "<PageMeta title=… description=… />",
        actual: "no <PageMeta /> block found",
      },
    ];
  }
  const issues: DriftIssue[] = [];
  if (extracted.title !== meta.title) {
    issues.push({
      route: meta.route,
      source: meta.source,
      field: "title",
      expected: meta.title,
      actual: extracted.title,
    });
  }
  if (extracted.description !== meta.description) {
    issues.push({
      route: meta.route,
      source: meta.source,
      field: "description",
      expected: meta.description,
      actual: extracted.description,
    });
  }
  const expectedOg = meta.ogImage;
  const actualOg = extracted.ogImage
    ? extracted.ogImage.startsWith("http")
      ? extracted.ogImage
      : `${BASE_URL}${extracted.ogImage.startsWith("/") ? "" : "/"}${extracted.ogImage}`
    : DEFAULT_OG;
  if (expectedOg !== actualOg) {
    issues.push({
      route: meta.route,
      source: meta.source,
      field: "ogImage",
      expected: expectedOg,
      actual: actualOg,
    });
  }
  const expectedAppendSiteName = meta.appendSiteName ?? true;
  const actualAppendSiteName = extracted.appendSiteName ?? true;
  if (expectedAppendSiteName !== actualAppendSiteName) {
    issues.push({
      route: meta.route,
      source: meta.source,
      field: "appendSiteName",
      expected: String(expectedAppendSiteName),
      actual: String(actualAppendSiteName),
    });
  }
  return issues;
}

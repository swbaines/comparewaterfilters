import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminNav from "@/components/AdminNav";
import PageMeta from "@/components/PageMeta";
import { ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";

const BASE_URL = "https://www.comparewaterfilters.com.au";
const SITE_NAME = "Compare Water Filters";
const DEFAULT_OG = `${BASE_URL}/og-default.jpg`;

interface RouteMeta {
  route: string;
  title: string;
  description: string;
  /** Computed canonical URL (BASE_URL + path). */
  canonical: string;
  /** OG image URL (defaults to DEFAULT_OG). */
  ogImage: string;
  /** Source file path (for reference). */
  source: string;
  /** True when title/description are dynamic and computed at runtime. */
  dynamic?: boolean;
}

/**
 * Static snapshot of the metadata each route emits via <PageMeta />.
 * Mirrors the literals in src/pages/*.tsx — keep in sync when you change
 * the marketing copy. The SEO regression test (jsonLdMetadata.test.ts +
 * seoMetadata.test.ts) catches drift.
 */
const ROUTES: RouteMeta[] = [
  {
    route: "/",
    source: "src/pages/HomePage.tsx",
    title: "Whole House Water Filters Australia — Compare & Get Free Quotes",
    description:
      "Compare whole house water filters, reverse osmosis and under-sink systems across Australia. Free quotes from trusted local installers.",
    canonical: `${BASE_URL}/`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/quiz",
    source: "src/pages/QuizPage.tsx",
    title: "Whole House Water Filter Quiz — Find Your Match in 2 Minutes",
    description:
      "Answer a few quick questions about your home and water concerns to get personalised whole house water filter recommendations and free quotes.",
    canonical: `${BASE_URL}/quiz`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/system-types",
    source: "src/pages/SystemTypesPage.tsx",
    title: "Whole House Water Filter Types Compared — RO, Carbon, UV",
    description:
      "Compare whole house water filter types: reverse osmosis, under-sink carbon, UV and water softeners. Pros, cons, pricing and who each suits in Australia.",
    canonical: `${BASE_URL}/system-types`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/pricing-guide",
    source: "src/pages/PricingGuidePage.tsx",
    title:
      "Whole House Water Filter Prices Australia 2026 — Installed Costs",
    description:
      "How much does a whole house water filter cost in Australia? Installed prices from $300–$6,000, maintenance costs and what affects pricing per system type.",
    canonical: `${BASE_URL}/pricing-guide`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/learn",
    source: "src/pages/LearnPage.tsx",
    title: "Whole House Water Filter Guides & Articles for Australian Homes",
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
    title: "About Compare Water Filters — Independent Australian Platform",
    description:
      "Independent Australian platform helping households choose the right whole house water filter and connect with trusted local providers.",
    canonical: `${BASE_URL}/about`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/water-quality",
    source: "src/pages/WaterQualityPage.tsx",
    title:
      "Water Quality by Suburb Australia — Hardness, Chlorine & Fluoride",
    description:
      "Free suburb water quality lookup for Australia. Check hardness, chlorine and fluoride, then get whole house water filter recommendations for your area.",
    canonical: `${BASE_URL}/water-quality`,
    ogImage: DEFAULT_OG,
  },
  {
    route: "/provider-match",
    source: "src/pages/ProviderMatchPage.tsx",
    title: "Get Matched With Whole House Water Filter Providers",
    description:
      "Request free quotes from vetted whole house water filter providers in your area. Independent, no-obligation matching across Australia.",
    canonical: `${BASE_URL}/provider-match`,
    ogImage: DEFAULT_OG,
  },
];

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

interface MetaIssue {
  level: "warn" | "error";
  message: string;
}

function audit(meta: RouteMeta): MetaIssue[] {
  const issues: MetaIssue[] = [];
  if (meta.dynamic) return issues;
  const fullTitle = meta.title.includes(SITE_NAME)
    ? meta.title
    : `${meta.title} | ${SITE_NAME}`;
  if (fullTitle.length > TITLE_LIMIT + 5) {
    issues.push({
      level: "warn",
      message: `Title is ${fullTitle.length} chars (target ≤ ${TITLE_LIMIT}).`,
    });
  }
  if (meta.description.length > DESC_LIMIT) {
    issues.push({
      level: "warn",
      message: `Description is ${meta.description.length} chars (target ≤ ${DESC_LIMIT}).`,
    });
  }
  if (/whole[\s-]home/i.test(meta.title)) {
    issues.push({
      level: "error",
      message: "Title contains 'whole home' (must use 'whole house').",
    });
  }
  if (
    /whole[\s-]home/i.test(meta.description) &&
    !/whole[\s-]house/i.test(meta.description)
  ) {
    issues.push({
      level: "error",
      message:
        "Description mentions 'whole home' without 'whole house' as primary.",
    });
  }
  return issues;
}

export default function AdminSeoPreviewPage() {
  const [filter, setFilter] = useState("");
  const [liveTitle, setLiveTitle] = useState("");
  const [liveCanonical, setLiveCanonical] = useState("");

  useEffect(() => {
    setLiveTitle(document.title);
    const link = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    setLiveCanonical(link?.href ?? "");
  }, []);

  const filtered = ROUTES.filter(
    (r) =>
      filter === "" ||
      r.route.toLowerCase().includes(filter.toLowerCase()) ||
      r.title.toLowerCase().includes(filter.toLowerCase()) ||
      r.description.toLowerCase().includes(filter.toLowerCase()),
  );

  const totalIssues = ROUTES.reduce((n, r) => n + audit(r).length, 0);

  return (
    <div className="container max-w-6xl py-8">
      <PageMeta
        title="SEO Preview — Admin"
        description="Internal SEO snapshot."
        path="/admin/seo-preview"
      />
      <AdminNav />

      <div className="mb-6 mt-6">
        <h1 className="text-3xl font-bold tracking-tight">SEO Preview</h1>
        <p className="mt-2 text-muted-foreground">
          Computed title, description, canonical and OG image for every public
          route. Use this to spot-check metadata before publishing.
        </p>
      </div>

      <Card className="mb-6 p-4">
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Routes tracked</div>
            <div className="text-2xl font-semibold">{ROUTES.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Issues detected</div>
            <div
              className={`text-2xl font-semibold ${
                totalIssues > 0 ? "text-destructive" : "text-primary"
              }`}
            >
              {totalIssues}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Live page (this tab)</div>
            <div className="truncate font-medium" title={liveTitle}>
              {liveTitle}
            </div>
            <div
              className="truncate text-xs text-muted-foreground"
              title={liveCanonical}
            >
              {liveCanonical || "—"}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <Input
          placeholder="Filter by route, title or description…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((meta) => {
          const issues = audit(meta);
          const fullTitle = meta.title.includes(SITE_NAME)
            ? meta.title
            : `${meta.title} | ${SITE_NAME}`;
          return (
            <Card key={meta.route} className="overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-sm font-medium">
                      {meta.route}
                    </code>
                    {meta.dynamic && (
                      <Badge variant="secondary">Dynamic</Badge>
                    )}
                    {issues.length === 0 ? (
                      <Badge
                        variant="outline"
                        className="gap-1 text-primary"
                      >
                        <CheckCircle2 className="h-3 w-3" /> OK
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {issues.length} issue{issues.length === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {meta.source}
                  </div>
                </div>
                {!meta.dynamic && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={meta.route} target="_blank">
                      Open <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-[160px_1fr]">
                <img
                  src={meta.ogImage}
                  alt=""
                  className="h-20 w-40 rounded border bg-muted object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Title{" "}
                      <span className="ml-1 normal-case">
                        ({fullTitle.length} chars)
                      </span>
                    </div>
                    <div className="font-medium text-primary">{fullTitle}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Description{" "}
                      <span className="ml-1 normal-case">
                        ({meta.description.length} chars)
                      </span>
                    </div>
                    <div>{meta.description}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Canonical
                    </div>
                    <code className="break-all text-xs">{meta.canonical}</code>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      OG Image
                    </div>
                    <code className="break-all text-xs">{meta.ogImage}</code>
                  </div>
                  {issues.length > 0 && (
                    <ul className="mt-2 space-y-1 rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
                      {issues.map((i, idx) => (
                        <li
                          key={idx}
                          className={
                            i.level === "error"
                              ? "text-destructive"
                              : "text-amber-700 dark:text-amber-400"
                          }
                        >
                          • {i.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No routes match “{filter}”.
          </p>
        )}
      </div>
    </div>
  );
}
